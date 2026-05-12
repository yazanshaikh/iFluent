<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Level extends Model
{
    protected $fillable = [
        'code',
        'name',
        'name_en',
        'description',
        'order',
        'total_units',
        'total_lessons',
        'is_active',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'total_units'   => 'integer',
        'total_lessons' => 'integer',
        'order'         => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class)->orderBy('order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('order');
    }
}
