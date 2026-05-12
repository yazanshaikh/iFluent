<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    protected $fillable = [
        'level_id',
        'name',
        'name_en',
        'order',
        'lesson_count',
        'has_end_test',
        'is_active',
    ];

    protected $casts = [
        'has_end_test' => 'boolean',
        'is_active'    => 'boolean',
        'lesson_count' => 'integer',
        'order'        => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }

    /** Students enrolled in this unit */
    public function enrolledStudents(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'student_units', 'unit_id', 'student_id')
            ->withPivot(['status', 'enrolled_at', 'completed_at', 'expires_at'])
            ->withTimestamps();
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('order');
    }
}
