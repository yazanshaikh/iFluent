<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    protected $fillable = [
        'quiz_id',
        'question',
        'options',
        'correct_answer',
        'order',
    ];

    protected $casts = [
        'options'        => 'array',
        'correct_answer' => 'integer',
        'order'          => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Check if the given answer index is correct.
     */
    public function isCorrect(int $answerIndex): bool
    {
        return $answerIndex === $this->correct_answer;
    }
}
