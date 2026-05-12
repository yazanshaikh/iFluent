<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    protected $fillable = [
        'student_id',
        'quiz_id',
        'lesson_id',
        'selected_question_ids',
        'submitted_answers',
        'score',
        'correct_count',
        'total_questions',
        'passed',
        'started_at',
        'submitted_at',
    ];

    protected $casts = [
        'selected_question_ids' => 'array',
        'submitted_answers'     => 'array',
        'score'                 => 'integer',
        'correct_count'         => 'integer',
        'total_questions'       => 'integer',
        'passed'                => 'boolean',
        'started_at'            => 'datetime',
        'submitted_at'          => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isSubmitted(): bool
    {
        return $this->submitted_at !== null;
    }

    public function isPending(): bool
    {
        return $this->submitted_at === null;
    }
}
