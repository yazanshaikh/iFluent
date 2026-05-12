<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'lead_id',
        'profile_photo',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->latest('activated_at');
    }

    // ─── Progress Helpers (used by SS role) ───────────────────────────────────

    /**
     * Returns all active subscription packages for this student.
     * SS staff uses this to see what the student has access to.
     */
    public function activePackages()
    {
        return $this->subscriptions()
            ->with('package')
            ->where('status', Subscription::STATUS_ACTIVE)
            ->get()
            ->pluck('package');
    }
}
