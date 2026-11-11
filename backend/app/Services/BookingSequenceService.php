<?php

namespace App\Services;

use App\Models\GroupClass;
use App\Models\GroupClassRegistration;
use App\Models\Session;
use App\Models\SessionRequest;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Rules for a student holding several upcoming lessons at once.
 *
 * Lessons follow the bookings' dates: the earliest upcoming booking holds the
 * student's current lesson, the next one the following lesson, and so on. When
 * a booking drops out (cancelled, absent, expired) the later bookings keep
 * their times and move up one lesson, so no lesson is skipped.
 */
class BookingSequenceService
{
    public const MAX_UPCOMING = 4;
    public const WINDOW_DAYS  = 14;
    public const MIN_GAP_MINUTES = 29; // lessons must start at least 30 minutes apart (students and teachers)

    /** Every upcoming booking of this student, trial lessons included. */
    public static function upcomingCount(int $userId): int
    {
        $requests = self::unacceptedRequests($userId)
            ->where('requested_at_utc', '>', now())
            ->count();

        $sessions = Session::where('student_id', $userId)
            ->whereIn('status', [Session::STATUS_WAITING, Session::STATUS_ACTIVE])
            ->count();

        $groupClasses = self::upcomingGroupRegistrations($userId)->count();

        return $requests + $sessions + $groupClasses;
    }

    /** True when another booking of this student is less than 30 minutes from $slot. */
    public static function hasConflict(int $userId, CarbonInterface $slot): bool
    {
        $window = [
            $slot->copy()->subMinutes(self::MIN_GAP_MINUTES),
            $slot->copy()->addMinutes(self::MIN_GAP_MINUTES),
        ];

        return self::unacceptedRequests($userId)->whereBetween('requested_at_utc', $window)->exists()
            || Session::where('student_id', $userId)
                ->whereIn('status', [Session::STATUS_WAITING, Session::STATUS_ACTIVE])
                ->whereBetween('scheduled_at', $window)
                ->exists()
            || self::upcomingGroupRegistrations($userId)
                ->whereHas('groupClass', fn ($class) => $class->whereBetween('scheduled_at', $window))
                ->exists();
    }

    /** True when each remaining lesson of the plan already has a booking. */
    public static function allLessonsReserved(int $userId): bool
    {
        $subscription = self::subscriptionFor($userId);

        return $subscription
            && self::upcomingLessons($userId)->count() >= self::openLessonIds($subscription, $userId)->count();
    }

    /** Re-assign lessons to the student's upcoming bookings, in date order. */
    public static function resequence(?int $userId): void
    {
        if (! $userId) {
            return;
        }

        DB::transaction(function () use ($userId) {
            User::whereKey($userId)->lockForUpdate()->first();

            $subscription = self::subscriptionFor($userId);
            if (! $subscription) {
                return;
            }

            $lessonIds = self::openLessonIds($subscription, $userId);

            foreach (self::upcomingLessons($userId) as $index => $booking) {
                $lessonId = $lessonIds->get($index);
                if ($lessonId === null) {
                    break;
                }

                if ($booking instanceof Session) {
                    if ((int) $booking->lesson_id !== (int) $lessonId) {
                        // A Nearpod PIN belongs to one lesson, so the teacher enters a new one.
                        $booking->update(['lesson_id' => $lessonId, 'nearpod_pin' => null]);
                        SessionRequest::where('session_id', $booking->id)->update(['lesson_id' => $lessonId]);
                    }
                } elseif ((int) $booking->lesson_id !== (int) $lessonId) {
                    $booking->update(['lesson_id' => $lessonId]);
                }
            }
        });
    }

    /** For scheduled jobs and post-commit hooks: one failure must not stop the rest. */
    public static function resequenceMany(iterable $userIds): void
    {
        foreach (collect($userIds)->filter()->unique() as $userId) {
            try {
                self::resequence((int) $userId);
            } catch (\Throwable $e) {
                Log::error('Booking resequence failed', ['user_id' => $userId, 'error' => $e->getMessage()]);
            }
        }
    }

    /** Cancel what has not started yet when the student's subscription is cancelled. */
    public static function cancelUpcoming(int $userId, string $reason): void
    {
        $sessionIds = Session::where('student_id', $userId)
            ->where('status', Session::STATUS_WAITING)
            ->whereHas('lesson', fn ($lesson) => $lesson->where('is_assessment', false))
            ->pluck('id');

        Session::whereIn('id', $sessionIds)->update([
            'status'   => Session::STATUS_CANCELLED,
            'ended_at' => now(),
        ]);

        SessionRequest::where('student_id', $userId)
            ->whereIn('type', [SessionRequest::TYPE_CORE, SessionRequest::TYPE_PRIVATE])
            ->whereIn('status', [SessionRequest::STATUS_PENDING, SessionRequest::STATUS_CONFIRMED])
            ->where(fn ($q) => $q->whereNull('session_id')->orWhereIn('session_id', $sessionIds))
            ->update([
                'status'              => SessionRequest::STATUS_CANCELLED,
                'cancellation_reason' => $reason,
            ]);

        GroupClassService::dropUpcomingRegistrations($userId);
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    private static function upcomingGroupRegistrations(int $userId)
    {
        return GroupClassRegistration::where('student_id', $userId)
            ->whereHas('groupClass', fn ($class) => $class
                ->whereIn('status', [GroupClass::STATUS_SCHEDULED, GroupClass::STATUS_ACTIVE]));
    }

    private static function unacceptedRequests(int $userId)
    {
        return SessionRequest::where('student_id', $userId)
            ->whereIn('status', [SessionRequest::STATUS_PENDING, SessionRequest::STATUS_CONFIRMED])
            ->whereNull('session_id');
    }

    private static function subscriptionFor(int $userId): ?Subscription
    {
        $student = Student::where('user_id', $userId)->first();

        return $student
            ? Subscription::where('student_id', $student->id)
                ->where('status', Subscription::STATUS_ACTIVE)
                ->whereNotNull('current_lesson_id')
                ->latest('activated_at')
                ->first()
            : null;
    }

    /** Remaining plan lessons, minus any lesson being taught right now. */
    private static function openLessonIds(Subscription $subscription, int $userId): Collection
    {
        $inProgress = Session::where('student_id', $userId)
            ->where('status', Session::STATUS_ACTIVE)
            ->pluck('lesson_id');

        return $subscription->remainingLessonIds()->diff($inProgress)->values();
    }

    /** Regular (non-trial) bookings that have not started, earliest first. */
    private static function upcomingLessons(int $userId): Collection
    {
        // Same 15-minute grace the expiry job gives a teacher to accept.
        $requests = self::unacceptedRequests($userId)
            ->where('status', SessionRequest::STATUS_PENDING)
            ->whereIn('type', [SessionRequest::TYPE_CORE, SessionRequest::TYPE_PRIVATE])
            ->where('requested_at_utc', '>=', now()->subMinutes(15))
            ->get();

        $sessions = Session::where('student_id', $userId)
            ->where('status', Session::STATUS_WAITING)
            ->whereHas('lesson', fn ($lesson) => $lesson->where('is_assessment', false))
            ->get();

        return $requests->toBase()
            ->merge($sessions)
            ->sortBy(fn ($booking) => ($booking instanceof Session
                ? $booking->scheduled_at
                : $booking->requested_at_utc)->getTimestamp())
            ->values();
    }
}
