<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CcLedgerEntry extends Model
{
    const TYPE_DUE    = 'due';
    const TYPE_REFUND = 'refund';

    protected $fillable = ['user_id', 'type', 'amount', 'created_by', 'settled_at'];

    protected function casts(): array
    {
        return [
            'amount'     => 'decimal:2',
            'settled_at' => 'datetime',
        ];
    }

    public function scopeOpen($query)
    {
        return $query->whereNull('settled_at');
    }
}
