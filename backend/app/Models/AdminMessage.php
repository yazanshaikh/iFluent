<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class AdminMessage extends Model
{
    protected $fillable = ['title', 'body', 'target', 'sent_by'];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    /**
     * The students (users) who received this message.
     * Recipients are resolved once at send time — no drift after sending.
     */
    public function recipients(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'admin_message_recipients',
            'admin_message_id',
            'user_id',
        )->withPivot('read_at')->withTimestamps();
    }
}
