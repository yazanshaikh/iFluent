<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GroupClass extends Model
{
    use SoftDeletes;

    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_ACTIVE    = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'teacher_id', 'title', 'description', 'lesson_id',
        'scheduled_at', 'max_seats', 'registered_count',
        'status', 'daily_room_name', 'daily_room_url',
        'started_at', 'ended_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at'   => 'datetime',
        'ended_at'     => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function teacher(): BelongsTo   { return $this->belongsTo(User::class, 'teacher_id'); }
    public function lesson(): BelongsTo    { return $this->belongsTo(Lesson::class); }
    public function registrations(): HasMany { return $this->hasMany(GroupClassRegistration::class); }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isScheduled(): bool { return $this->status === self::STATUS_SCHEDULED; }
    public function isActive(): bool    { return $this->status === self::STATUS_ACTIVE; }
    public function hasSeats(): bool    { return $this->registered_count < $this->max_seats; }
    public function availableSeats(): int { return max(0, $this->max_seats - $this->registered_count); }

    public function isRegistered(int $studentId): bool
    {
        return $this->registrations()->where('student_id', $studentId)->exists();
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeUpcoming($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
                     ->where('scheduled_at', '>', now())
                     ->orderBy('scheduled_at');
    }

    public function scopeForTeacher($query, int $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }
}
