<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionRequest extends Model
{
    // ─── Status Constants ─────────────────────────────────────────────────────
    const STATUS_PENDING   = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_REJECTED  = 'rejected';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_EXPIRED   = 'expired';

    // ─── Type Constants ───────────────────────────────────────────────────────
    const TYPE_DEMO    = 'demo';
    const TYPE_CORE    = 'core';
    const TYPE_PRIVATE = 'private';
    const TYPE_GROUP   = 'group';

    protected $fillable = [
        'type',
        'requested_by',
        'student_id',
        'target_teacher_id',
        'assigned_teacher_id',
        'lesson_id',
        'lead_id',
        'requested_at_utc',
        'confirmed_at',
        'status',
        'rejection_reason',
        'cancellation_reason',
        'session_id',
        'teacher_gender_pref',
    ];

    protected $casts = [
        'requested_at_utc' => 'datetime',
        'confirmed_at'     => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function targetTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_teacher_id');
    }

    public function assignedTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_teacher_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isPending(): bool   { return $this->status === self::STATUS_PENDING; }
    public function isConfirmed(): bool { return $this->status === self::STATUS_CONFIRMED; }
    public function isRejected(): bool  { return $this->status === self::STATUS_REJECTED; }
    public function isCancelled(): bool { return $this->status === self::STATUS_CANCELLED; }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeForTeacher($query, int $teacherId)
    {
        // A teacher sees: private requests directed to them + core/demo pool (no target teacher)
        return $query->where(function ($q) use ($teacherId) {
            $q->where('target_teacher_id', $teacherId)
              ->orWhere(function ($q2) {
                  $q2->whereIn('type', [self::TYPE_CORE, self::TYPE_DEMO])
                     ->whereNull('assigned_teacher_id');
              });
        });
    }

    public function scopePool($query)
    {
        // Unassigned core/demo requests visible to all teachers
        return $query->whereIn('type', [self::TYPE_CORE, self::TYPE_DEMO])
                     ->whereNull('assigned_teacher_id')
                     ->where('status', self::STATUS_PENDING);
    }
}
