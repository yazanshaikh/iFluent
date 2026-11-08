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
    const STATUS_NO_ANSWER      = 'no_answer';      // مارد (لم يرد) — كان in_progress
    const STATUS_INTERESTED     = 'interested';     // مهتم
    const STATUS_NOT_INTERESTED = 'not_interested'; // غير مهتم
    const STATUS_POSTPONED      = 'postponed';      // تأجيل
    const STATUS_TRIAL_SESSION  = 'trial_session';  // حصة تجريبية
    const STATUS_OPEN_SEA       = 'open_sea';       // البحر المفتوح — نظام
    const STATUS_SUBSCRIBER     = 'subscriber';     // مشترك — نظام

    protected $fillable = [
        'name',
        'phone',
        'source',
        'scheduled_at',
        'age',
        'status',
        'assigned_to',
        'first_assigned_to',
        'is_small_treasure',
        'moved_to_open_sea_at',
        'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'is_small_treasure'    => 'boolean',
            'scheduled_at'         => 'datetime',
            'moved_to_open_sea_at' => 'datetime',
            'converted_at'         => 'datetime',
        ];
    }

    /**
     * Store phones in canonical E.164 so a lead matches the student User row at
     * login time (User::firstOrCreate uses E.164; without this, Arabic-Indic /
     * local-format leads never link to the new student account).
     */
    public function setPhoneAttribute($value): void
    {
        $this->attributes['phone'] = $value === null
            ? null
            : \App\Support\Phone::normalizeOrRaw($value);
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

    public function sessionRequests(): HasMany
    {
        return $this->hasMany(\App\Models\SessionRequest::class);
    }

    public function latestDemoSession(): HasOne
    {
        return $this->hasOne(\App\Models\SessionRequest::class)
            ->where('type', \App\Models\SessionRequest::TYPE_DEMO)
            ->whereIn('status', ['pending', 'confirmed'])
            ->latest('requested_at_utc');
    }

    // ─── Open Sea transfer (manual) ───────────────────────────────────────────

    /** Days without any update after which a lead is flagged "ترحيل" (move to Open Sea). */
    const OPEN_SEA_STALE_DAYS = 5;

    /** Statuses a lead can be moved to the Open Sea from. */
    const OPEN_SEA_ELIGIBLE_STATUSES = [
        self::STATUS_NEW,
        self::STATUS_NO_ANSWER,
        self::STATUS_INTERESTED,
        self::STATUS_NOT_INTERESTED,
        self::STATUS_POSTPONED,
    ];

    /**
     * Subscribed = status "subscriber" OR the student has an active subscription.
     * Subscribed students never appear in the Lead Pool / Open Sea.
     */
    public function scopeNotSubscribed($query)
    {
        return $query->where('status', '!=', self::STATUS_SUBSCRIBER)
            ->whereDoesntHave('student.subscriptions', fn ($s) => $s->where('status', Subscription::STATUS_ACTIVE));
    }

    /**
     * Stale lead waiting for a manual "ترحيل": eligible status, not Small Treasure,
     * not subscribed, untouched for OPEN_SEA_STALE_DAYS. (No longer moved automatically.)
     */
    public function scopeStaleForOpenSea($query)
    {
        return $query->whereIn('status', self::OPEN_SEA_ELIGIBLE_STATUSES)
            ->where(fn ($q) => $q->where('is_small_treasure', false)->orWhereNull('is_small_treasure'))
            ->where('updated_at', '<=', now()->subDays(self::OPEN_SEA_STALE_DAYS))
            ->notSubscribed();
    }

    public function isStaleForOpenSea(): bool
    {
        return in_array($this->status, self::OPEN_SEA_ELIGIBLE_STATUSES, true)
            && !$this->is_small_treasure
            && $this->updated_at !== null
            && $this->updated_at->lte(now()->subDays(self::OPEN_SEA_STALE_DAYS))
            && static::whereKey($this->id)->notSubscribed()->exists();
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

    /**
     * Find a lead by phone, tolerant of format differences (+962 / leading 0 /
     * spaces). Tries an exact string match first — preserving the original
     * behaviour — then falls back to comparing the last 9 digits, so the same
     * human registering via /register and later booking with a differently
     * formatted number always resolves to ONE lead instead of a duplicate.
     * Includes soft-deleted leads (callers restore as needed).
     */
    public static function findByPhoneFlexible(string $phone): ?self
    {
        $exact = static::withTrashed()->where('phone', $phone)->first();
        if ($exact) {
            return $exact;
        }

        $digits = preg_replace('/\D/', '', $phone);
        if (strlen($digits) < 8) {
            return null;
        }

        return static::withTrashed()
            ->whereRaw("RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) = ?", [substr($digits, -9)])
            ->orderByDesc('id')
            ->first();
    }
}
