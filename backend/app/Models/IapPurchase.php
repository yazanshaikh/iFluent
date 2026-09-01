<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A verified in-app purchase. One row per Apple transaction — the unique
 * transaction_id is what makes a receipt single-use.
 */
class IapPurchase extends Model
{
    protected $fillable = [
        'user_id',
        'platform',
        'product_id',
        'transaction_id',
        'original_transaction_id',
        'session_request_id',
        'purchased_at',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'purchased_at' => 'datetime',
            'payload'      => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessionRequest(): BelongsTo
    {
        return $this->belongsTo(SessionRequest::class);
    }
}
