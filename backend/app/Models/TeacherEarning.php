<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherEarning extends Model
{
    protected $fillable = [
        'teacher_id',
        'session_id',
        'amount',
        'session_type',
        'notes',
        'credited_at',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'credited_at' => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeForTeacher($query, int $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }
}
