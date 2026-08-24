<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lesson extends Model
{
    protected $fillable = [
        'level_id',
        'unit_id',
        'title',
        'description',
        'order',
        'nearpod_lesson_id',
        'nearpod_url',
        'pdf_url',
        'activity_url',
        'is_active',
        'is_assessment',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'is_assessment' => 'boolean',
        'order'         => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(Quiz::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(StudentProgress::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isAssessment(): bool { return $this->is_assessment; }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('order');
    }

    public function scopeRegular($query)
    {
        return $query->where('is_assessment', false);
    }

    public function scopeAssessment($query)
    {
        return $query->where('is_assessment', true);
    }

    /**
     * The assessment lesson a trial should default to: the lowest level's (A1).
     *
     * Assessment lessons sit outside units and all carry order = 0, so the old
     * `orderBy('order')` left Postgres free to return ANY of them — trials were
     * landing on the B2/FT assessment at random. Order by the LEVEL instead
     * (levels.order is 1–5), which is both deterministic and the sensible
     * starting point for someone new.
     */
    public function scopeDefaultAssessment($query)
    {
        return $query->where('is_assessment', true)
            ->where('is_active', true)
            ->leftJoin('levels', 'lessons.level_id', '=', 'levels.id')
            ->orderBy('levels.order')
            ->orderBy('lessons.id')
            ->select('lessons.*');
    }
}
