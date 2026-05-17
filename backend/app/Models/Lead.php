<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_NEW            = 'new';            // جديد
    const STATUS_IN_PROGRESS    = 'in_progress';    // قيد التنفيذ
    const STATUS_INTERESTED     = 'interested';     // مهتم
    const STATUS_NOT_INTERESTED = 'not_interested'; // غير مهتم
    const STATUS_POSTPONED      = 'postponed';      // تاجيل
    const STATUS_OPEN_SEA       = 'open_sea';       // البحر المفتوح — نظام
    const STATUS_SUBSCRIBER     = 'subscriber';     // مشترك — نظام

    protected $fillable = [
        'name',
        'phone',
        'source',
        'age',
        'status',
        'assigned_to',
        'is_small_treasure',
        'moved_to_open_sea_at',
        'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_small_treasure'    => 'boolean',
            'moved_to_open_sea_at' => 'datetime',
            'converted_at'         => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function remarks(): HasMany
    {
        return $this->hasMany(LeadRemark::class)->latest();
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isInOpenSea(): bool
    {
        return $this->status === self::STATUS_OPEN_SEA;
    }

    public function isSubscriber(): bool
    {
        return $this->status === self::STATUS_SUBSCRIBER;
    }
}
