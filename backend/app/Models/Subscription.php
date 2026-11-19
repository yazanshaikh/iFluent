<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasFactory;

    const STATUS_PENDING_SCREENSHOT = 'pending_screenshot';
    const STATUS_PENDING            = 'pending_approval';
    const STATUS_ACTIVE             = 'active';
    const STATUS_EXPIRED            = 'expired';
    const STATUS_CANCELLED          = 'cancelled';

    const TYPE_INDIVIDUAL = 'individual';
    const TYPE_GROUP      = 'group';

    /**
     * "Package ending soon" on Paid Students. A student with an active package
     * (and no renewal awaiting approval) is flagged when EITHER:
     *   - they have NEAR_END_LESSONS lessons left or fewer, or
     *   - the package's end date is NEAR_END_DAYS days away or fewer
     *     (or has already passed while lessons are still left).
     * Days are counted on the Jordan calendar (NEAR_END_TIMEZONE).
     */
    const NEAR_END_LESSONS  = 3;
    const NEAR_END_DAYS     = 7;
    const NEAR_END_TIMEZONE = 'Asia/Amman';

    /** Days a no-longer-subscribed student stays on the Paid Students list. */
    const NOT_SUBSCRIBED_GRACE_DAYS = 3;

    protected $fillable = [
        'invoice_uuid',
        'student_id',
        'package_id',
        'months_count',
        'lessons_count',
        'from_lesson_id',
        'to_lesson_id',
        'current_lesson_id',
        'payment_account_id',
        'activated_by',
        'approved_by',
        'status',
        'subscription_type',
        'amount_paid',
        'payment_method',
        'payment_reference',
        'payment_screenshot',
        'activated_at',
        'approved_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid'   => 'decimal:2',
            'activated_at'  => 'datetime',
            'approved_at'   => 'datetime',
            'expires_at'    => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function paymentAccount(): BelongsTo
    {
        return $this->belongsTo(PaymentAccount::class);
    }

    public function activatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function fromLesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'from_lesson_id');
    }

    public function toLesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'to_lesson_id');
    }

    public function currentLesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'current_lesson_id');
    }

    // ─── Lesson Range Helpers ─────────────────────────────────────────────────

    /**
     * Returns true if the subscription has a lesson range configured.
     */
    public function hasLessonRange(): bool
    {
        return $this->from_lesson_id !== null && $this->to_lesson_id !== null;
    }

    /**
     * Returns true if there are still lessons left in the package.
     */
    public function hasRemainingLessons(): bool
    {
        return $this->current_lesson_id !== null;
    }

    /**
     * Returns the set of lesson IDs the given user has PAID for — the union of
     * all their active subscription ranges (from_lesson_id → to_lesson_id).
     *
     * Used to gate the curriculum so the student only ever sees / books lessons
     * inside their paid range, even when a unit is partially covered.
     */
    public static function paidLessonIdsForUser(int $userId): \Illuminate\Support\Collection
    {
        $student = Student::where('user_id', $userId)->first();
        if (!$student) {
            return collect();
        }

        $subs = self::where('student_id', $student->id)
            ->where('status', self::STATUS_ACTIVE)
            ->whereNotNull('from_lesson_id')
            ->whereNotNull('to_lesson_id')
            ->get(['from_lesson_id', 'to_lesson_id']);

        $ids = collect();
        foreach ($subs as $sub) {
            $lo = min($sub->from_lesson_id, $sub->to_lesson_id);
            $hi = max($sub->from_lesson_id, $sub->to_lesson_id);
            $ids = $ids->merge(
                Lesson::whereBetween('id', [$lo, $hi])->pluck('id')
            );
        }

        return $ids->unique()->values();
    }

    /**
     * Enroll the student in every unit covered by this subscription's lesson
     * range (from_lesson_id → to_lesson_id). Units already enrolled are skipped.
     *
     * This bridges the gap between the subscription (tracked by lesson-ID range)
     * and the curriculum view in the student app (driven by student_units).
     *
     * Returns the number of NEW unit enrollments created.
     * Safe to call multiple times (idempotent).
     */
    public function enrollCoveredUnits(): int
    {
        if (!$this->hasLessonRange()) {
            return 0;
        }

        $lo = min($this->from_lesson_id, $this->to_lesson_id);
        $hi = max($this->from_lesson_id, $this->to_lesson_id);

        // Distinct units that have at least one lesson inside the range
        // (assessment lessons have no unit_id → naturally excluded)
        $unitIds = Lesson::whereBetween('id', [$lo, $hi])
            ->whereNotNull('unit_id')
            ->distinct()
            ->pluck('unit_id');

        if ($unitIds->isEmpty()) {
            return 0;
        }

        // Resolve the user (student_units pivot keys on users.id via the relation)
        $user = $this->student?->user;
        if (!$user) {
            return 0;
        }

        // Skip units the student is already enrolled in
        $alreadyEnrolled = $user->enrolledUnits()->pluck('units.id');
        $toEnroll = $unitIds->diff($alreadyEnrolled);

        if ($toEnroll->isEmpty()) {
            return 0;
        }

        $pivot = $toEnroll->mapWithKeys(fn ($id) => [
            $id => ['status' => 'active', 'enrolled_at' => now()],
        ])->all();

        $user->enrolledUnits()->attach($pivot);

        return $toEnroll->count();
    }

    /** All lessons in the plan's range, ordered by curriculum position. */
    public function lessonsInRange(): \Illuminate\Support\Collection
    {
        return Lesson::whereBetween('id', [
                min($this->from_lesson_id, $this->to_lesson_id),
                max($this->from_lesson_id, $this->to_lesson_id),
            ])
            ->with(['unit.level'])
            ->get()
            ->sortBy(fn($l) => [
                $l->unit->level->order ?? 999,
                $l->unit->order        ?? 999,
                $l->order              ?? 999,
            ])
            ->values()
            ->toBase();
    }

    /** Lesson ids still to be taught: current_lesson_id through to_lesson_id, in order. */
    public function remainingLessonIds(): \Illuminate\Support\Collection
    {
        return $this->current_lesson_id
            ? $this->lessonIdsFrom($this->current_lesson_id)
            : collect();
    }

    /** Every lesson id on this plan, in teaching order. */
    public function planLessonIds(): \Illuminate\Support\Collection
    {
        return $this->from_lesson_id
            ? $this->lessonIdsFrom($this->from_lesson_id)
            : collect();
    }

    private function lessonIdsFrom(int $startId): \Illuminate\Support\Collection
    {
        if (!$this->hasLessonRange()) {
            return collect();
        }

        $ids   = $this->lessonsInRange()->pluck('id')->values();
        $start = $ids->search($startId);
        $last  = $ids->search($this->to_lesson_id);

        if ($start === false || $last === false || $last < $start) {
            return collect();
        }

        return $ids->slice($start, $last - $start + 1)->values();
    }

    /** The type of the student's latest active plan, or null when they have none. */
    public static function activeTypeForUser(int $userId): ?string
    {
        $student = Student::where('user_id', $userId)->first();

        return $student
            ? self::where('student_id', $student->id)
                ->where('status', self::STATUS_ACTIVE)
                ->latest('activated_at')
                ->value('subscription_type')
            : null;
    }

    /**
     * Advance current_lesson_id to the next lesson within the range.
     *
     * Strategy: find lessons ordered by (level.order, unit.order, lesson.order)
     * that are between from_lesson_id and to_lesson_id, then pick the one
     * that comes after current_lesson_id.
     *
     * Returns the new current lesson, or null if the package is exhausted.
     * MUST be called inside a DB::transaction().
     */
    public function advanceToNextLesson(): ?Lesson
    {
        if (!$this->hasLessonRange() || !$this->current_lesson_id) {
            return null;
        }

        $from    = $this->fromLesson()->with('unit.level')->first();
        $to      = $this->toLesson()->with('unit.level')->first();
        $current = $this->currentLesson()->with('unit.level')->first();

        if (!$from || !$to || !$current) {
            return null;
        }

        $lessonsInRange = $this->lessonsInRange();

        // Find position of current lesson in the ordered list
        $currentIndex = $lessonsInRange->search(fn($l) => $l->id === $this->current_lesson_id);

        if ($currentIndex === false) {
            // Current lesson not found in range — mark as exhausted
            $this->update(['current_lesson_id' => null]);
            return null;
        }

        // ── Explicit boundary check ───────────────────────────────────────────
        // If current lesson IS the last lesson (to_lesson_id), the package
        // is exhausted — set current_lesson_id to null and stop booking.
        if ($this->current_lesson_id === $this->to_lesson_id) {
            $this->update(['current_lesson_id' => null]);
            return null;
        }

        $nextLesson = $lessonsInRange->get($currentIndex + 1); // null if end of array

        // Double-safety: if somehow next lesson is beyond to_lesson_id, null it out
        if ($nextLesson && !$lessonsInRange->contains('id', $nextLesson->id)) {
            $nextLesson = null;
        }

        $this->update(['current_lesson_id' => $nextLesson?->id]);

        return $nextLesson;
    }

    // ─── Package Ending Soon ──────────────────────────────────────────────────

    /**
     * Why a student's package is ending soon, or null when it isn't.
     *
     * $subs: the student's subscriptions (must include every active and
     * pending-approval one). $lessonsLeft: the student's lesson_credits.
     *
     * Returns ['lessons_left' => ?int, 'days_left' => ?int]; each key is set
     * only when that measure triggered the flag. days_left < 0 means the end
     * date has passed but the package stays active until its lessons are used.
     */
    public static function endingSoonReason(\Illuminate\Support\Collection $subs, int $lessonsLeft): ?array
    {
        $active = $subs->where('status', self::STATUS_ACTIVE);

        if ($active->isEmpty() || $subs->contains('status', self::STATUS_PENDING)) {
            return null;
        }

        // Several active packages (a renewal approved early) → the latest end date counts.
        // A package without an end date never triggers the date measure.
        $daysLeft = null;
        if (!$active->contains(fn ($s) => $s->expires_at === null)) {
            $today   = now(self::NEAR_END_TIMEZONE)->startOfDay();
            $endDay  = $active->max('expires_at')->copy()->setTimezone(self::NEAR_END_TIMEZONE)->startOfDay();
            $days    = (int) round($today->diffInDays($endDay, false));
            $daysLeft = $days <= self::NEAR_END_DAYS ? $days : null;
        }

        $lessons = $lessonsLeft <= self::NEAR_END_LESSONS ? max(0, $lessonsLeft) : null;

        if ($lessons === null && $daysLeft === null) {
            return null;
        }

        return ['lessons_left' => $lessons, 'days_left' => $daysLeft];
    }

    /**
     * The same rule as endingSoonReason(), as a query constraint on a Student
     * query — used for the Paid Students filter and the sidebar count.
     */
    public static function constrainStudentsEndingSoon($studentQuery): void
    {
        // First moment that is MORE than NEAR_END_DAYS calendar days away
        $notSoon = now(self::NEAR_END_TIMEZONE)->startOfDay()->addDays(self::NEAR_END_DAYS + 1)->utc();

        $studentQuery
            ->whereHas('subscriptions', fn ($s) => $s->where('status', self::STATUS_ACTIVE))
            ->whereDoesntHave('subscriptions', fn ($s) => $s->where('status', self::STATUS_PENDING))
            ->where(fn ($either) => $either
                ->whereHas('user', fn ($u) => $u->where('lesson_credits', '<=', self::NEAR_END_LESSONS))
                ->orWhereDoesntHave('subscriptions', fn ($s) => $s
                    ->where('status', self::STATUS_ACTIVE)
                    ->where(fn ($x) => $x->whereNull('expires_at')->orWhere('expires_at', '>=', $notSoon))));
    }

    // ─── Status Helpers ───────────────────────────────────────────────────────

    public function isPendingScreenshot(): bool { return $this->status === self::STATUS_PENDING_SCREENSHOT; }
    public function isPending(): bool           { return $this->status === self::STATUS_PENDING; }
    public function isActive(): bool            { return $this->status === self::STATUS_ACTIVE; }
}
