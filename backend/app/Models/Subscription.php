<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasFactory;

    const STATUS_PENDING_SCREENSHOT = 'pending_screenshot'; // invoice generated, awaiting receipt
    const STATUS_PENDING            = 'pending_approval';   // receipt uploaded, awaiting admin
    const STATUS_ACTIVE             = 'active';
    const STATUS_EXPIRED            = 'expired';
    const STATUS_CANCELLED          = 'cancelled';

    protected $fillable = [
        'invoice_uuid',
        'student_id',
        'package_id',
        'months_count',
        'payment_account_id',
        'activated_by',
        'approved_by',
        'status',
        'amount_paid',
        'payment_method',
        'payment_reference',
        'payment_screenshot',
        'activated_at',
        'approved_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid'   => 'decimal:2',
            'activated_at'  => 'datetime',
            'approved_at'   => 'datetime',
            'expires_at'    => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function paymentAccount(): BelongsTo
    {
        return $this->belongsTo(PaymentAccount::class);
    }

    public function activatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isPendingScreenshot(): bool
    {
        return $this->status === self::STATUS_PENDING_SCREENSHOT;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}
