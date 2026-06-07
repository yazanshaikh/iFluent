<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'teacher_code',
        'bio',
        'specialization',
        'profile_photo',
        'commission_rate',
        'balance',
        'is_active',
        'zoom_user_id',
        'sessions_count_reset_at',
        'balance_reset_at',
        'absences_reset_at',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate'         => 'decimal:2',
            'balance'                 => 'decimal:2',
            'is_active'               => 'boolean',
            'sessions_count_reset_at' => 'datetime',
            'balance_reset_at'        => 'datetime',
            'absences_reset_at'       => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
