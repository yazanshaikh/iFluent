<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentProgress extends Model
{
    protected $fillable = [
        'student_id',
        'lesson_id',
        'quiz_id',
        'score',
        'attempts',
        'passed',
        'passed_at',
        'lesson_completed',
        'completed_at',
    ];

    protected $casts = [
        'score'            => 'integer',
        'attempts'         => 'integer',
        'passed'           => 'boolean',
        'passed_at'        => 'datetime',
        'lesson_completed' => 'boolean',
        'completed_at'     => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const PASS_MARK = 60; // 60% required to pass

    public function hasPassed(): bool
    {
        return $this->score !== null && $this->score >= self::PASS_MARK;
    }
}
