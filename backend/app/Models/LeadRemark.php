<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadRemark extends Model
{
    // Remarks are immutable: no updated_at column (PRD 5.4.2)
    const UPDATED_AT = null;

    protected $fillable = [
        'lead_id',
        'staff_id',
        'content',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
