<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\GroupClass;
use App\Models\GroupClassRegistration;
use App\Models\Subscription;
use App\Models\User;
use App\Services\BookingSequenceService;
use App\Services\GroupClassService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GroupClassController extends Controller
{
    /** Registration closes this many minutes before the class starts. */
    private const REGISTRATION_CLOSES_MINUTES = 5;

    /** A registered student can leave until this many minutes before the start. */
    private const LEAVE_CLOSES_MINUTES = 30;

    // ─── Classes on the student's plan ────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $student = $request->user();
        $this->requireGroupPlan($student);

        $next = GroupClassService::nextLessonId($student->id);

        return response()->json([
            'data'        => $this->classesFor($student, $next)->values(),
            'next_lesson' => $next ? \App\Models\Lesson::select('id', 'title')->find($next) : null,
            'credits'     => (int) $student->lesson_credits,
        ]);
    }

    public function show(GroupClass $groupClass, Request $request): JsonResponse
    {
        $student = $request->user();
        $this->requireGroupPlan($student);

        $class = $this->classesFor($student, GroupClassService::nextLessonId($student->id))
            ->firstWhere('id', $groupClass->id);

        if (! $class && $groupClass->isRegistered($student->id)) {
            $plan  = GroupClassService::planLessonIds($student->id);
            $class = $this->present($groupClass->load(['teacher:id,name', 'teacher.teacher:id,user_id,teacher_code', 'lesson:id,title,description,activity_url,pdf_url']), $plan->flip(), true, false);
        }

        if (! $class) {
            return response()->json(['message' => 'هذه الحصة غير متاحة.'], 404);
        }

        return response()->json(['class' => $class]);
    }

    /** Every class the student registered for, newest first — used by «حصصي». */
    public function mine(Request $request): JsonResponse
    {
        $student = $request->user();
        $plan    = GroupClassService::planLessonIds($student->id)->flip();

        $classes = GroupClass::with(['teacher:id,name', 'teacher.teacher:id,user_id,teacher_code', 'lesson:id,title,description,activity_url,pdf_url'])
            ->whereHas('registrations', fn ($q) => $q->where('student_id', $student->id))
            ->orderByDesc('scheduled_at')
            ->limit(100)
            ->get();

        $joinedAt = GroupClassRegistration::where('student_id', $student->id)
            ->whereIn('group_class_id', $classes->pluck('id'))
            ->pluck('joined_at', 'group_class_id');

        return response()->json([
            'data' => $classes->map(fn ($class) => [
                ...$this->present($class, $plan, true, false),
                'attended' => GroupClassService::attended($class, $joinedAt[$class->id] ?? null),
            ])->values(),
        ]);
    }

    // ─── Register / leave / join ──────────────────────────────────────────────

    public function register(GroupClass $groupClass, Request $request): JsonResponse
    {
        $student = $request->user();
        $this->requireGroupPlan($student);

        $seatsLeft = DB::transaction(function () use ($groupClass, $student) {
            // Lock order: student, then class, so a double tap can't pass twice.
            $locked = User::whereKey($student->id)->lockForUpdate()->first();
            $class  = GroupClass::lockForUpdate()->find($groupClass->id);

            if (! $class->isScheduled() || ! self::registrationOpen($class)) {
                $this->deny('انتهى موعد التسجيل في هذه الحصة. يُغلق التسجيل قبل ٥ دقائق من موعدها.');
            }

            $plan = GroupClassService::planLessonIds($student->id);

            if (! $plan->contains($class->lesson_id)) {
                $this->deny('هذا الدرس خارج نطاق خطتك الدراسية الحالية.', 403);
            }

            if (GroupClassService::completedLessonIds($student->id, collect([$class->lesson_id]))->isNotEmpty()) {
                $this->deny('لقد أكملت هذا الدرس مسبقاً.');
            }

            if (GroupClassService::reservedLessonIds($student->id)->contains($class->lesson_id)) {
                $this->deny('أنت مسجل بالفعل في حصة لهذا الدرس.');
            }

            if ($locked->lesson_credits < 1) {
                $this->deny('لا توجد حصص متاحة حالياً. يرجى التواصل مع مركزك التعليمي.', 403);
            }

            if (BookingSequenceService::upcomingCount($student->id) >= BookingSequenceService::MAX_UPCOMING) {
                $this->deny('لا يمكن أن يتجاوز عدد حصصك القادمة ٤ حصص. يرجى إكمال إحداها أو إلغاؤها أولاً.');
            }

            if (BookingSequenceService::hasConflict($student->id, $class->scheduled_at)) {
                $this->deny('لديك حصة أخرى ضمن نصف ساعة من هذا الموعد. يجب أن يفصل بين الحصص نصف ساعة على الأقل.');
            }

            if (! $class->hasSeats()) {
                $this->deny('عذراً، اكتمل عدد المقاعد في هذه الحصة.');
            }

            GroupClassRegistration::create([
                'group_class_id' => $class->id,
                'student_id'     => $student->id,
                'registered_at'  => now(),
            ]);

            $class->increment('registered_count');
            $locked->decrement('lesson_credits');

            return $class->availableSeats();
        });

        return response()->json([
            'message'         => 'تم تسجيلك في الحصة بنجاح.',
            'available_seats' => $seatsLeft,
        ], 201);
    }

    public function leave(GroupClass $groupClass, Request $request): JsonResponse
    {
        $student = $request->user();

        DB::transaction(function () use ($groupClass, $student) {
            $class = GroupClass::lockForUpdate()->find($groupClass->id);

            if (! $class->isScheduled() || ! self::leaveOpen($class)) {
                $this->deny('لا يمكن إلغاء التسجيل قبل أقل من نصف ساعة من موعد الحصة.');
            }

            $registration = GroupClassRegistration::where('group_class_id', $class->id)
                ->where('student_id', $student->id)
                ->first();

            if (! $registration) {
                $this->deny('أنت غير مسجل في هذه الحصة.');
            }

            GroupClassService::refund($registration);
            $registration->delete();
            $class->decrement('registered_count');
        });

        return response()->json(['message' => 'تم إلغاء تسجيلك وإعادة الحصة إلى رصيدك.']);
    }

    public function join(GroupClass $groupClass, Request $request): JsonResponse
    {
        $student = $request->user();

        if (! $groupClass->isActive()) {
            return response()->json([
                'message' => $groupClass->isScheduled()
                    ? 'لم تبدأ الحصة بعد. يرجى انتظار المعلم.'
                    : 'انتهت هذه الحصة.',
            ], 422);
        }

        $registration = GroupClassRegistration::where('group_class_id', $groupClass->id)
            ->where('student_id', $student->id)
            ->first();

        if (! $registration) {
            return response()->json(['message' => 'أنت غير مسجل في هذه الحصة.'], 403);
        }

        // As with individual lessons, the teacher sets the Nearpod PIN first.
        if (empty($groupClass->nearpod_pin)) {
            return response()->json(['message' => 'المعلم يجهّز الحصة على Nearpod. يرجى المحاولة بعد لحظات.'], 425);
        }

        // Mark join time (first time only) — this is what counts as attendance.
        if (! $registration->joined_at) {
            $registration->update(['joined_at' => now()]);
        }

        return response()->json([
            'class_id'       => $groupClass->id,
            'title'          => $groupClass->title,
            'daily_room_url' => $groupClass->daily_room_url,
            'nearpod_pin'    => $groupClass->nearpod_pin,
            // Students always join with the PIN link, never the teacher's lesson link.
            'nearpod_url'    => 'https://nearpod.com/student/?pin=' . strtoupper($groupClass->nearpod_pin),
            'teacher'        => ['name' => $groupClass->teacher?->name],
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function deny(string $message, int $status = 422): never
    {
        throw new HttpResponseException(response()->json(['message' => $message], $status));
    }

    private function requireGroupPlan(User $student): void
    {
        if (Subscription::activeTypeForUser($student->id) !== Subscription::TYPE_GROUP) {
            $this->deny('اشتراكك الحالي لا يشمل الحصص الجماعية.', 403);
        }
    }

    /**
     * Upcoming and running classes on the student's plan, in plan order.
     * Exactly one class carries is_next: the earliest open class of the next lesson.
     */
    private function classesFor(User $student, ?int $nextLessonId): Collection
    {
        $plan      = GroupClassService::planLessonIds($student->id);
        $completed = GroupClassService::completedLessonIds($student->id, $plan);
        $position  = $plan->flip();

        // Open for registration, or already registered and not over yet.
        $classes = GroupClass::with(['teacher:id,name', 'teacher.teacher:id,user_id,teacher_code', 'lesson:id,title,description,activity_url,pdf_url'])
            ->whereIn('lesson_id', $plan->diff($completed))
            ->where(fn ($q) => $q
                ->where(fn ($open) => $open
                    ->where('status', GroupClass::STATUS_SCHEDULED)
                    ->where('scheduled_at', '>', now()->addMinutes(self::REGISTRATION_CLOSES_MINUTES)))
                ->orWhere(fn ($mine) => $mine
                    ->whereIn('status', [GroupClass::STATUS_SCHEDULED, GroupClass::STATUS_ACTIVE])
                    ->whereHas('registrations', fn ($r) => $r->where('student_id', $student->id))))
            ->orderBy('scheduled_at')
            ->get()
            ->sortBy(fn ($class) => $position[$class->lesson_id])
            ->values()
            ->toBase();

        $mine = GroupClassRegistration::where('student_id', $student->id)
            ->whereIn('group_class_id', $classes->pluck('id'))
            ->pluck('group_class_id')
            ->flip();

        $nextClassId = $classes
            ->first(fn ($class) => $class->lesson_id === $nextLessonId
                && ! isset($mine[$class->id])
                && $class->isScheduled()
                && self::registrationOpen($class)
                && $class->hasSeats())
            ?->id;

        return $classes->map(fn ($class) => $this->present(
            $class, $position, isset($mine[$class->id]), $class->id === $nextClassId,
        ));
    }

    private function present(GroupClass $class, Collection $position, bool $registered, bool $isNext): array
    {
        $upcoming = $class->isScheduled();

        return [
            'id'                => $class->id,
            'title'             => $class->title,
            'description'       => $class->description,
            'status'            => $class->status,
            'scheduled_at'      => $class->scheduled_at?->toIso8601String(),
            'teacher'           => ['name' => $class->teacher?->name, 'code' => $class->teacher?->teacher?->teacher_code],
            'lesson'            => $class->lesson
                ? [
                    'id'           => $class->lesson->id,
                    'title'        => $class->lesson->title,
                    'description'  => $class->lesson->description,
                    'activity_url' => $class->lesson->activity_url,
                    'pdf_url'      => $class->lesson->pdf_url,
                ]
                : null,
            'lesson_number'     => isset($position[$class->lesson_id]) ? $position[$class->lesson_id] + 1 : null,
            'max_seats'         => $class->max_seats,
            'registered_count'  => $class->registered_count,
            'available_seats'   => $class->availableSeats(),
            'is_registered'     => $registered,
            'is_full'           => ! $class->hasSeats(),
            'is_next'           => $isNext,
            'registration_open' => ! $registered && $upcoming && self::registrationOpen($class) && $class->hasSeats(),
            'can_leave'         => $registered && $upcoming && self::leaveOpen($class),
            // Same rule as individual lessons: the activity opens once the student attended.
            'activity_unlocked' => $registered && GroupClassService::attended(
                $class,
                GroupClassRegistration::where('group_class_id', $class->id)
                    ->where('student_id', request()->user()->id)
                    ->value('joined_at'),
            ),
        ];
    }

    private static function registrationOpen(GroupClass $class): bool
    {
        return $class->scheduled_at->isAfter(now()->addMinutes(self::REGISTRATION_CLOSES_MINUTES));
    }

    private static function leaveOpen(GroupClass $class): bool
    {
        return $class->scheduled_at->isAfter(now()->addMinutes(self::LEAVE_CLOSES_MINUTES));
    }
}
