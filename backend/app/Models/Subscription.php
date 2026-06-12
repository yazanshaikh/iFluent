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

        // Fetch all lessons in range ordered by curriculum position
        $lessonsInRange = Lesson::whereBetween('id', [
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
            ->values();

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

    // ─── Status Helpers ───────────────────────────────────────────────────────

    public function isPendingScreenshot(): bool { return $this->status === self::STATUS_PENDING_SCREENSHOT; }
    public function isPending(): bool           { return $this->status === self::STATUS_PENDING; }
    public function isActive(): bool            { return $this->status === self::STATUS_ACTIVE; }
}
