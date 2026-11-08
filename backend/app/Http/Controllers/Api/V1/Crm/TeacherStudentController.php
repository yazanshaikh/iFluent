<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LeadResource;
use App\Http\Resources\Api\V1\StaffResource;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Teacher ↔ subscribed-student assignment (super_admin + SS/LP).
 *
 * One teacher per student (students.teacher_user_id). Organisational only —
 * bookings are not restricted by it. Deleting a teacher sends their students
 * back to the "no teacher" pool (FK nullOnDelete); deactivating keeps them.
 */
class TeacherStudentController extends Controller
{
    /** GET /crm/teachers — list for the LP "المعلمين" page */
    public function index(): JsonResponse
    {
        $teachers = User::withTrashed()
            ->where('role', User::ROLE_TEACHER)
            ->with('teacher:id,user_id,teacher_code')
            ->withCount('taughtStudents')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $teachers->map(fn (User $t) => [
                'id'             => $t->id,
                'name'           => $t->name,
                'teacher_code'   => $t->teacher?->teacher_code,
                'is_active'      => !$t->trashed(),
                'students_count' => $t->taught_students_count,
            ]),
        ]);
    }

    /**
     * GET /crm/teachers/{id} — teacher profile for LP.
     * Same shape as the admin staff profile, minus the money fields.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $teacher = $this->findTeacher($id);
        $data    = (new StaffResource($teacher->load('teacher')))->toArray($request);

        if (!$request->user()->isSuperAdmin() && isset($data['teacher_profile'])) {
            unset(
                $data['teacher_profile']['balance'],
                $data['teacher_profile']['balance_reset_at'],
                $data['teacher_profile']['commission_rate'],
                $data['teacher_profile']['session_commission'],
                $data['teacher_profile']['conversion_commission'],
                $data['teacher_profile']['conversion_commission_rate'],
                $data['teacher_profile']['group_commission'],
                $data['teacher_profile']['group_commission_rate'],
            );
        }

        return response()->json($data);
    }

    /** GET /crm/teachers/{id}/students — students assigned to this teacher */
    public function students(Request $request, int $id): JsonResponse
    {
        $this->findTeacher($id);

        $students = Student::where('teacher_user_id', $id)
            ->with($this->studentRelations())
            ->get()
            ->sortBy(fn (Student $s) => $this->studentName($s))
            ->values();

        return response()->json([
            'data' => $students->map(fn (Student $s) => $this->presentStudent($s, $request->user())),
        ]);
    }

    /** GET /crm/teachers/unassigned-students — subscribed students with no teacher yet */
    public function unassigned(Request $request): JsonResponse
    {
        $students = Student::whereNull('teacher_user_id')
            ->whereHas('subscriptions', fn ($q) => $q->where('status', Subscription::STATUS_ACTIVE))
            ->with($this->studentRelations())
            ->get()
            ->sortBy(fn (Student $s) => $this->studentName($s))
            ->values();

        return response()->json([
            'data' => $students->map(fn (Student $s) => $this->presentStudent($s, $request->user())),
        ]);
    }

    /** POST /crm/teachers/{id}/students  { student_id } */
    public function assign(Request $request, int $id): JsonResponse
    {
        $data    = $request->validate(['student_id' => ['required', 'integer']]);
        $teacher = $this->findTeacher($id);

        if ($teacher->trashed()) {
            return response()->json(['message' => 'المعلم معطّل — لا يمكن إضافة طلاب له.'], 422);
        }

        return DB::transaction(function () use ($data, $teacher, $request) {
            $student = Student::whereKey($data['student_id'])->lockForUpdate()->first();

            if (!$student) {
                return response()->json(['message' => 'الطالب غير موجود.'], 404);
            }

            if (!$student->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists()) {
                return response()->json(['message' => 'يمكن إضافة الطلاب المشتركين فقط.'], 422);
            }

            if ($student->teacher_user_id !== null) {
                $current = User::withTrashed()->find($student->teacher_user_id)?->name ?? '—';
                return response()->json([
                    'message' => "الطالب مع المعلم {$current} — احذفه من عنده أولاً.",
                ], 422);
            }

            $student->update(['teacher_user_id' => $teacher->id]);

            return response()->json([
                'message' => 'تمت إضافة الطالب للمعلم.',
                'data'    => $this->presentStudent($student->load($this->studentRelations()), $request->user()),
            ], 201);
        });
    }

    /** DELETE /crm/teachers/{id}/students/{student} — back to the "no teacher" pool */
    public function unassign(int $id, Student $student): JsonResponse
    {
        if ($student->teacher_user_id !== $id) {
            return response()->json(['message' => 'الطالب ليس مع هذا المعلم.'], 422);
        }

        $student->update(['teacher_user_id' => null]);

        return response()->json(['message' => 'تم حذف الطالب من عند المعلم.']);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function findTeacher(int $id): User
    {
        return User::withTrashed()->where('role', User::ROLE_TEACHER)->findOrFail($id);
    }

    private function studentRelations(): array
    {
        return [
            'user:id,name,phone',
            'lead:id,name,phone,assigned_to',
            'lead.assignedTo:id,name,role',
            'activeSubscription:id,student_id,status,lessons_count,months_count,expires_at,activated_at',
        ];
    }

    private function studentName(Student $s): string
    {
        return $s->lead?->name ?? $s->user?->name ?? '';
    }

    private function presentStudent(Student $s, User $viewer): array
    {
        $sub = $s->activeSubscription;

        return [
            'id'      => $s->id,
            'lead_id' => $s->lead_id,
            'name'    => $this->studentName($s) ?: '—',
            'phone'   => $s->lead
                ? LeadResource::phoneFor($s->lead, $viewer)
                : ($viewer->isSuperAdmin() ? $s->user?->phone : null),
            'lp'      => $s->lead?->assignedTo?->role === User::ROLE_SS
                ? ['id' => $s->lead->assignedTo->id, 'name' => $s->lead->assignedTo->name]
                : null,
            'subscription' => $sub ? [
                'lessons_count' => $sub->lessons_count,
                'months_count'  => $sub->months_count,
                'expires_at'    => $sub->expires_at?->toIso8601String(),
            ] : null,
            'is_subscribed' => (bool) $sub,
        ];
    }
}
