<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Lesson;
use App\Models\Session;
use App\Models\SessionRequest;
use App\Models\User;
use App\Services\DailyCoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * CRM Demo Booking — Sales Staff books a demo session for a lead.
 *
 * Flow:
 * 1. CC/SS picks a date/time and optionally a teacher (by teacher_code)
 * 2. System creates a session_request of type=demo
 * 3. If target_teacher_id set: directed to that teacher
 * 4. If no teacher: goes to pool (any teacher can accept)
 * 5. Teacher accepts → Daily.co room created → session started when teacher clicks start
 */
class DemoBookingController extends Controller
{
    public function __construct(private DailyCoService $daily) {}

    /**
     * POST /crm/demo-requests/{sessionRequest}/withdraw-teacher
     *
     * Take a trial back from its teacher and return it to the open pool, so any
     * other teacher can pick it up. This is NOT a cancellation — the customer
     * keeps their booking and time slot; only the teacher assignment is undone.
     * Admin-only.
     */
    public function withdrawTeacher(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'هذا الإجراء متاح لمدير النظام فقط.'], 403);
        }

        if (!in_array($sessionRequest->status, [
            SessionRequest::STATUS_PENDING,
            SessionRequest::STATUS_CONFIRMED,
        ], true)) {
            return response()->json([
                'message' => 'يمكن سحب الحصص المعلّقة أو المؤكدة فقط.',
            ], 422);
        }

        if (!$sessionRequest->target_teacher_id && !$sessionRequest->assigned_teacher_id) {
            return response()->json([
                'message' => 'هذه الحصة غير معيّنة لأي معلم — هي أصلاً ضمن الطلبات المتاحة.',
            ], 422);
        }

        // A confirmed request already has a Session (created the moment the
        // teacher accepted). Undo it, otherwise the slot stays half-taken.
        $session = $sessionRequest->session_id ? Session::find($sessionRequest->session_id) : null;

        if ($session) {
            if (in_array($session->status, [Session::STATUS_ACTIVE, Session::STATUS_COMPLETED], true)) {
                return response()->json([
                    'message' => 'لا يمكن سحب حصة بدأت أو انتهت بالفعل.',
                ], 422);
            }

            if ($session->daily_room_name) {
                try {
                    $this->daily->deleteRoom($session->daily_room_name);
                } catch (\Throwable $e) {
                    Log::warning('withdrawTeacher: deleteRoom failed', [
                        'session_id' => $session->id,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            $session->update([
                'status'   => Session::STATUS_CANCELLED,
                'ended_at' => now(),
            ]);
        }

        $sessionRequest->update([
            'status'              => SessionRequest::STATUS_PENDING,
            'target_teacher_id'   => null,
            'assigned_teacher_id' => null,
            'confirmed_at'        => null,
            'session_id'          => null,
        ]);

        return response()->json([
            'message' => 'تم سحب الحصة من المعلم وإرجاعها للطلبات المتاحة.',
        ]);
    }

    /**
     * POST /crm/demo-requests/{sessionRequest}/assign-teacher   { teacher_id }
     *
     * Direct a pending trial at one specific teacher — it then shows in that
     * teacher's directed requests and they confirm it themselves. Admin-only.
     */
    public function assignTeacher(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'هذا الإجراء متاح لمدير النظام فقط.'], 403);
        }

        $validated = $request->validate([
            'teacher_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $teacher = User::find($validated['teacher_id']);

        if (!$teacher->isTeacher()) {
            return response()->json(['message' => 'المستخدم المحدّد ليس معلماً.'], 422);
        }

        if ($sessionRequest->status !== SessionRequest::STATUS_PENDING) {
            return response()->json([
                'message' => 'يمكن توجيه الحصص المعلّقة فقط — هذه الحصة تم قبولها أو إلغاؤها.',
            ], 422);
        }

        $sessionRequest->update(['target_teacher_id' => $teacher->id]);

        return response()->json([
            'message' => "تم توجيه الحصة للمعلم {$teacher->name}.",
        ]);
    }

    public function store(Lead $lead, Request $request): JsonResponse
    {
        $staff = $request->user();

        // Lead must have a student account (checkout done) or be in working/subscriber state
        // Demo sessions can be booked at any lead stage — the lesson is an assessment lesson
        $assessmentLesson = null;

        $validated = $request->validate([
            'lesson_id'    => ['sometimes', 'nullable', 'integer', 'exists:lessons,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'teacher_code' => ['sometimes', 'nullable', 'string'],
            'notes'        => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        // ── Block if lead already has an active future booking ────────────────────
        $activeBooking = SessionRequest::where('lead_id', $lead->id)
            ->where('type', SessionRequest::TYPE_DEMO)
            ->whereIn('status', [SessionRequest::STATUS_PENDING, SessionRequest::STATUS_CONFIRMED])
            ->where('requested_at_utc', '>', now())
            ->first();

        if ($activeBooking) {
            return response()->json([
                'message' => 'يوجد حجز نشط لهذه الليدة — لا يمكن الحجز مجدداً حتى يبدأ موعد الحصة أو تُلغى.',
                'existing_booking' => [
                    'id'           => $activeBooking->id,
                    'scheduled_at' => $activeBooking->requested_at_utc->toIso8601String(),
                    'status'       => $activeBooking->status,
                ],
            ], 422);
        }

        // If lesson_id provided, use it; otherwise pick any active assessment lesson
        if (!empty($validated['lesson_id'])) {
            $lesson = Lesson::findOrFail($validated['lesson_id']);
            if (!$lesson->is_assessment) {
                return response()->json(['message' => 'Demo sessions must use an assessment lesson.'], 422);
            }
        } else {
            // Default: use first available assessment lesson
            $lesson = Lesson::assessment()->where('is_active', true)->orderBy('order')->first();
            if (!$lesson) {
                return response()->json(['message' => 'No assessment lessons available.'], 422);
            }
        }

        // Resolve the student user account (if lead has been converted)
        $studentUserId = null;
        if ($lead->student) {
            $studentUserId = $lead->student->user_id;
        }

        // Resolve teacher by teacher_code if provided
        $targetTeacherId = null;
        if (!empty($validated['teacher_code'])) {
            $teacher = \App\Models\Teacher::where('teacher_code', $validated['teacher_code'])
                ->where('is_active', true)
                ->first();

            if (!$teacher) {
                return response()->json(['message' => 'Teacher not found with that code.'], 404);
            }

            $targetTeacherId = $teacher->user_id;
        }

        // For demo requests, student_id can be the lead's student user OR we store null
        // and rely on lead_id to identify who it's for.
        // If student account exists, use it; otherwise the session will be linked to the lead.
        $sessionRequest = SessionRequest::create([
            'type'              => SessionRequest::TYPE_DEMO,
            'requested_by'      => $staff->id,
            'student_id'        => $studentUserId,  // null if no student account yet
            'lesson_id'         => $lesson->id,
            'lead_id'           => $lead->id,
            'target_teacher_id' => $targetTeacherId,
            'requested_at_utc'  => $validated['scheduled_at'],
            'status'            => SessionRequest::STATUS_PENDING,
            'note'              => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => $targetTeacherId
                ? 'Demo session request sent to the selected teacher.'
                : 'Demo session request sent to the teacher pool.',
            'request' => [
                'id'           => $sessionRequest->id,
                'type'         => $sessionRequest->type,
                'status'       => $sessionRequest->status,
                'scheduled_at' => $sessionRequest->requested_at_utc->toIso8601String(),
                'lesson'       => ['id' => $lesson->id, 'title' => $lesson->title],
                'lead_id'      => $lead->id,
            ],
        ], 201);
    }

    // ─── All Demo Bookings (CC sees own leads; admin sees all) ───────────────

    public function all(Request $request): JsonResponse
    {
        $staff     = $request->user();
        $status    = $request->query('status');     // optional filter
        $search    = $request->query('search');     // optional name/phone search
        $dateFrom  = $request->query('date_from');  // YYYY-MM-DD — بداية النطاق
        $dateTo    = $request->query('date_to');    // YYYY-MM-DD — نهاية النطاق

        $query = SessionRequest::where('type', SessionRequest::TYPE_DEMO)
            ->with([
                'lead:id,name,phone,assigned_to',
                'lead.assignedTo:id,name,role',
            ])
            // الحجوزات المعلقة (pending) تظهر دائماً بغض النظر عن العمر.
            // الحجوزات المنتهية/الملغاة/المؤكدة تظهر فقط خلال 24 ساعة من آخر تحديث.
            ->where(function ($q) {
                $q->where('status', SessionRequest::STATUS_PENDING)
                  ->orWhere(function ($q2) {
                      $q2->whereNotIn('status', [SessionRequest::STATUS_PENDING])
                         ->where('updated_at', '>=', now()->subDay());  // ← 24 hours (per requirement)
                  });
            })
            ->orderByDesc('requested_at_utc');

        // CC / SS — only see bookings for leads assigned to them
        if (!in_array($staff->role, ['super_admin'])) {
            $query->whereHas('lead', fn ($q) => $q->where('assigned_to', $staff->id));
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('lead', function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($dateFrom) {
            $query->whereDate('requested_at_utc', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('requested_at_utc', '<=', $dateTo);
        }

        $bookings = $query->with('session')->paginate(20);

        return response()->json([
            'data'         => $bookings->map(fn ($r) => [
                'id'          => $r->id,
                // Smart status mapping:
                // - If session exists AND is completed → show 'completed' (منتهية)
                // - Otherwise → show SessionRequest status (pending/confirmed/cancelled/etc)
                'status'             => ($r->session?->status === 'completed') ? 'completed' : $r->status,
                'attendance_status'  => $r->session?->attendance_status,  // attended | absent | teacher_absent | null
                'scheduled_at'       => $r->requested_at_utc?->toIso8601String(),
                'created_at'         => $r->created_at->toIso8601String(),
                'lead'        => $r->lead ? [
                    'id'    => $r->lead->id,
                    'name'  => $r->lead->name,
                    'phone' => $r->lead->phone,
                ] : null,
                'assigned_to' => $r->lead?->assignedTo ? [
                    'id'   => $r->lead->assignedTo->id,
                    'name' => $r->lead->assignedTo->name,
                    'role' => $r->lead->assignedTo->role,
                ] : null,
            ]),
            'total'        => $bookings->total(),
            'current_page' => $bookings->currentPage(),
            'last_page'    => $bookings->lastPage(),
        ]);
    }

    // ─── List Demo Requests for a Lead ───────────────────────────────────────

    public function index(Lead $lead): JsonResponse
    {
        $requests = SessionRequest::where('lead_id', $lead->id)
            ->where('type', SessionRequest::TYPE_DEMO)
            ->with([
                'assignedTeacher:id,name',
                'lesson:id,title',
                'session:id,teacher_joined_at,student_joined_at,ended_at,status,attendance_status,teacher_present,student_present',
            ])
            ->orderByDesc('requested_at_utc')
            ->get();

        return response()->json([
            'requests' => $requests->map(fn($r) => [
                'id'           => $r->id,
                'status'       => $r->status,
                'scheduled_at' => $r->requested_at_utc?->toIso8601String(),
                'lesson'       => $r->lesson ? ['id' => $r->lesson->id, 'title' => $r->lesson->title] : null,
                'teacher'      => $r->assignedTeacher ? ['name' => $r->assignedTeacher->name] : null,
                'session_id'   => $r->session_id,
                // بيانات الحضور — موجودة فقط عند ربط الجلسة الفعلية
                'attendance'   => $r->session ? [
                    'teacher_joined'    => (bool) ($r->session->teacher_joined_at ?? $r->session->teacher_present),
                    'student_joined'    => (bool) ($r->session->student_joined_at ?? $r->session->student_present),
                    'attendance_status' => $r->session->attendance_status,  // ← attended | absent | teacher_absent
                    'ended_at'          => $r->session->ended_at?->toIso8601String(),
                ] : null,
            ]),
        ]);
    }

    // ─── Cancel Demo Request ──────────────────────────────────────────────────

    public function cancel(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        if (!$sessionRequest->isPending()) {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        $sessionRequest->update([
            'status'              => SessionRequest::STATUS_CANCELLED,
            'cancellation_reason' => $request->input('reason'),
        ]);

        return response()->json(['message' => 'Demo request cancelled.']);
    }

    /**
     * PATCH /crm/demo-requests/{sessionRequest}/change-lesson
     * Change the assessment lesson (topic) of a pending demo booking.
     * The student's booking profile reads lesson_id → title + PDF reflect immediately.
     */
    public function changeLesson(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        if (!$sessionRequest->isPending()) {
            return response()->json(['message' => 'يمكن تغيير درس الطلبات المعلقة فقط.'], 422);
        }

        $validated = $request->validate([
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
        ]);

        $lesson = \App\Models\Lesson::findOrFail($validated['lesson_id']);

        if (!$lesson->is_assessment) {
            return response()->json(['message' => 'يجب اختيار حصة تقييمية.'], 422);
        }

        $sessionRequest->update(['lesson_id' => $lesson->id]);

        return response()->json([
            'message' => 'تم تغيير موضوع الحصة بنجاح.',
            'lesson'  => ['id' => $lesson->id, 'title' => $lesson->title],
        ]);
    }
}
