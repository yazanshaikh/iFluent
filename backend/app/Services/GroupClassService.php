<?php

namespace App\Services;

use App\Models\GroupClass;
use App\Models\GroupClassRegistration;
use App\Models\Session;
use App\Models\Student;
use App\Models\StudentProgress;
use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Rules shared by everyone who runs group classes (admin, teacher, scheduler)
 * and by the student's class list.
 *
 * A credit is taken at registration. It comes back when the student leaves
 * before the start or the class is cancelled; a student who registers and does
 * not attend keeps the lesson on their plan but does not get the credit back.
 */
class GroupClassService
{
    private const START_GRACE_MINUTES = 15;
    private const MAX_RUNNING_HOURS   = 2;

    // ─── Teacher schedule ─────────────────────────────────────────────────────

    /**
     * Why a teacher can't take this class, or null when they can:
     *   - an upcoming class of the same lesson (a repeat goes to another teacher)
     *   - another group class less than 30 minutes away
     *   - an individual lesson less than 30 minutes away
     */
    public static function scheduleProblem(int $teacherId, int $lessonId, CarbonInterface $slot, ?int $ignoreClassId = null): ?string
    {
        $classes = GroupClass::where('teacher_id', $teacherId)
            ->whereIn('status', [GroupClass::STATUS_SCHEDULED, GroupClass::STATUS_ACTIVE])
            ->when($ignoreClassId, fn ($q) => $q->whereKeyNot($ignoreClassId));

        if ((clone $classes)->where('lesson_id', $lessonId)->exists()) {
            return 'This teacher already has an upcoming class for this lesson. Choose another teacher.';
        }

        $window = self::window($slot);

        if ((clone $classes)->whereBetween('scheduled_at', $window)->exists()) {
            return 'This teacher already has a group class at this time.';
        }

        if (Session::where('teacher_id', $teacherId)
            ->whereIn('status', [Session::STATUS_WAITING, Session::STATUS_ACTIVE])
            ->whereBetween('scheduled_at', $window)
            ->exists()) {
            return 'This teacher already has an individual lesson within 30 minutes of this time.';
        }

        return null;
    }

    /** True when the teacher already has any lesson less than 30 minutes from $slot. */
    public static function teacherIsBusy(int $teacherId, CarbonInterface $slot, ?int $ignoreClassId = null): bool
    {
        $window = self::window($slot);

        return Session::where('teacher_id', $teacherId)
                ->whereIn('status', [Session::STATUS_WAITING, Session::STATUS_ACTIVE])
                ->whereBetween('scheduled_at', $window)
                ->exists()
            || GroupClass::where('teacher_id', $teacherId)
                ->whereIn('status', [GroupClass::STATUS_SCHEDULED, GroupClass::STATUS_ACTIVE])
                ->when($ignoreClassId, fn ($q) => $q->whereKeyNot($ignoreClassId))
                ->whereBetween('scheduled_at', $window)
                ->exists();
    }

    /** Lessons less than 30 minutes apart clash. */
    public static function window(CarbonInterface $slot): array
    {
        return [
            $slot->copy()->subMinutes(BookingSequenceService::MIN_GAP_MINUTES),
            $slot->copy()->addMinutes(BookingSequenceService::MIN_GAP_MINUTES),
        ];
    }

    // ─── Class lifecycle ──────────────────────────────────────────────────────

    /** Cancel a class that has not started and return every registered credit. */
    public function cancel(GroupClass $class): bool
    {
        return DB::transaction(function () use ($class) {
            $cancelled = GroupClass::whereKey($class->id)
                ->where('status', GroupClass::STATUS_SCHEDULED)
                ->update(['status' => GroupClass::STATUS_CANCELLED]);

            if (! $cancelled) {
                return false;
            }

            GroupClassRegistration::where('group_class_id', $class->id)
                ->get()
                ->each(fn ($registration) => self::refund($registration));

            return true;
        });
    }

    /** End a running class; whoever joined has completed the lesson. */
    public function complete(GroupClass $class): bool
    {
        return DB::transaction(function () use ($class) {
            $completed = GroupClass::whereKey($class->id)
                ->where('status', GroupClass::STATUS_ACTIVE)
                ->update(['status' => GroupClass::STATUS_COMPLETED, 'ended_at' => now()]);

            if (! $completed) {
                return false;
            }

            // Same rule as individual lessons: the student stayed at least 10 minutes.
            $attendees = GroupClassRegistration::where('group_class_id', $class->id)
                ->whereNotNull('joined_at')
                ->where('joined_at', '<=', now()->subMinutes(Session::MIN_SESSION_MINUTES))
                ->pluck('student_id');

            foreach ($attendees as $studentId) {
                if ($class->lesson_id) {
                    StudentProgress::updateOrCreate(
                        ['student_id' => $studentId, 'lesson_id' => $class->lesson_id],
                        ['lesson_completed' => true, 'completed_at' => now()],
                    );
                }
                self::syncCurrentLesson($studentId);
            }

            return true;
        });
    }

    /** Classes nobody started are cancelled; classes left open are closed. */
    public function expireOverdue(DailyCoService $daily): void
    {
        GroupClass::where('status', GroupClass::STATUS_SCHEDULED)
            ->where('scheduled_at', '<', now()->subMinutes(self::START_GRACE_MINUTES))
            ->get()
            ->each(fn ($class) => $this->cancel($class));

        GroupClass::where('status', GroupClass::STATUS_ACTIVE)
            ->where('started_at', '<', now()->subHours(self::MAX_RUNNING_HOURS))
            ->get()
            ->each(function ($class) use ($daily) {
                if (! $this->complete($class) || ! $class->daily_room_name) {
                    return;
                }
                try {
                    $daily->deleteRoom($class->daily_room_name);
                } catch (\Throwable $e) {
                    Log::warning('Group class room cleanup failed', ['class_id' => $class->id, 'error' => $e->getMessage()]);
                }
            });
    }

    /** Attended = joined and stayed at least 10 minutes before the class ended. */
    public static function attended(GroupClass $class, $joinedAt): bool
    {
        return $class->status === GroupClass::STATUS_COMPLETED
            && $joinedAt && $class->ended_at
            && \Illuminate\Support\Carbon::parse($joinedAt)->diffInMinutes($class->ended_at) >= Session::MIN_SESSION_MINUTES;
    }

    /** Return one registration's credit, at most once. */
    public static function refund(GroupClassRegistration $registration): void
    {
        $claimed = GroupClassRegistration::whereKey($registration->id)
            ->whereNull('credit_refunded_at')
            ->update(['credit_refunded_at' => now()]);

        if ($claimed) {
            User::whereKey($registration->student_id)->increment('lesson_credits');
        }
    }

    /** Remove upcoming registrations when the student's subscription is cancelled. */
    public static function dropUpcomingRegistrations(int $userId): void
    {
        GroupClassRegistration::where('student_id', $userId)
            ->whereHas('groupClass', fn ($q) => $q->where('status', GroupClass::STATUS_SCHEDULED))
            ->get()
            ->each(function ($registration) {
                GroupClass::whereKey($registration->group_class_id)->decrement('registered_count');
                $registration->delete();
            });
    }

    // ─── The student's plan ───────────────────────────────────────────────────

    /** Lesson ids across the student's active group plans, in teaching order. */
    public static function planLessonIds(int $userId): Collection
    {
        return self::groupSubscriptions($userId)
            ->flatMap(fn ($subscription) => $subscription->planLessonIds())
            ->unique()
            ->values();
    }

    public static function completedLessonIds(int $userId, Collection $lessonIds): Collection
    {
        return StudentProgress::where('student_id', $userId)
            ->whereIn('lesson_id', $lessonIds)
            ->where('lesson_completed', true)
            ->pluck('lesson_id');
    }

    /** Lessons the student already holds a seat for. */
    public static function reservedLessonIds(int $userId): Collection
    {
        return GroupClass::whereIn('status', [GroupClass::STATUS_SCHEDULED, GroupClass::STATUS_ACTIVE])
            ->whereHas('registrations', fn ($q) => $q->where('student_id', $userId))
            ->pluck('lesson_id');
    }

    /** The first plan lesson not completed and not already registered for. */
    public static function nextLessonId(int $userId): ?int
    {
        $plan = self::planLessonIds($userId);

        return $plan
            ->diff(self::completedLessonIds($userId, $plan))
            ->diff(self::reservedLessonIds($userId))
            ->first();
    }

    /** Group lessons can finish out of order, so the pointer follows completion. */
    private static function syncCurrentLesson(int $userId): void
    {
        foreach (self::groupSubscriptions($userId) as $subscription) {
            $plan = $subscription->planLessonIds();

            $subscription->update([
                'current_lesson_id' => $plan->diff(self::completedLessonIds($userId, $plan))->first(),
            ]);
        }
    }

    private static function groupSubscriptions(int $userId): Collection
    {
        $student = Student::where('user_id', $userId)->first();

        return $student
            ? Subscription::where('student_id', $student->id)
                ->where('status', Subscription::STATUS_ACTIVE)
                ->where('subscription_type', Subscription::TYPE_GROUP)
                ->orderBy('activated_at')
                ->get()
                ->toBase()
            : collect();
    }
}
