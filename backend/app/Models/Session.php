<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Session extends Model
{
    use SoftDeletes;

    // ─── Status Constants ─────────────────────────────────────────────────────
    const STATUS_WAITING   = 'waiting';
    const STATUS_ACTIVE    = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'lesson_id',
        'teacher_id',
        'student_id',
        'status',
        'daily_room_name',
        'daily_room_url',
        'nearpod_pin',
        'scheduled_at',
        'started_at',
        'student_joined_at',
        'teacher_joined_at',
        'ended_at',
    ];

    protected $casts = [
        'scheduled_at'      => 'datetime',
        'started_at'        => 'datetime',
        'student_joined_at' => 'datetime',
        'teacher_joined_at' => 'datetime',
        'ended_at'          => 'datetime',
    ];

    const MIN_SESSION_MINUTES = 10; // minimum minutes for commission to be credited

    // ─── Relationships ────────────────────────────────────────────────────────

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isWaiting(): bool   { return $this->status === self::STATUS_WAITING; }
    public function isActive(): bool    { return $this->status === self::STATUS_ACTIVE; }
    public function isCompleted(): bool { return $this->status === self::STATUS_COMPLETED; }
    public function isCancelled(): bool { return $this->status === self::STATUS_CANCELLED; }

    public function canBeStarted(): bool
    {
        return $this->isWaiting();
    }

    public function canBeEnded(): bool
    {
        return $this->isActive();
    }

    /**
     * Commission is earned only if:
     * - Student actually joined (student_joined_at is set)
     * - The time from student joining to session end is >= MIN_SESSION_MINUTES
     */
    public function isEligibleForCommission(): bool
    {
        if (!$this->student_joined_at || !$this->ended_at) {
            return false;
        }

        $minutesInSession = $this->student_joined_at->diffInMinutes($this->ended_at);

        return $minutesInSession >= self::MIN_SESSION_MINUTES;
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeForTeacher($query, int $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }
}
