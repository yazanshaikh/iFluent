<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionRating extends Model
{
    protected $fillable = [
        'session_id',
        'student_id',
        'teacher_id',
        'rating',
        'notes',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForTeacher($query, int $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }
}
