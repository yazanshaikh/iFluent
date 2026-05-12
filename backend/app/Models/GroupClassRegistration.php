<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupClassRegistration extends Model
{
    protected $fillable = ['group_class_id', 'student_id', 'registered_at', 'joined_at'];

    protected $casts = [
        'registered_at' => 'datetime',
        'joined_at'     => 'datetime',
    ];

    public function groupClass(): BelongsTo { return $this->belongsTo(GroupClass::class); }
    public function student(): BelongsTo    { return $this->belongsTo(User::class, 'student_id'); }
}
