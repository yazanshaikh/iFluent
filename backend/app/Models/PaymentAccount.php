<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentAccount extends Model
{
    protected $fillable = ['alias', 'cliq_name', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Round-robin: pick the next active account after the last one used globally.
     */
    public static function nextInRotation(): self
    {
        $accounts = static::where('is_active', true)->orderBy('sort_order')->get();

        if ($accounts->isEmpty()) {
            abort(500, 'No active payment accounts configured.');
        }

        $lastAccountId = Subscription::whereNotNull('payment_account_id')
            ->latest('id')
            ->value('payment_account_id');

        if (!$lastAccountId) {
            return $accounts->first();
        }

        $lastIndex = $accounts->search(fn($a) => $a->id === $lastAccountId);
        $nextIndex = ($lastIndex === false ? 0 : $lastIndex + 1) % $accounts->count();

        return $accounts[$nextIndex];
    }
}
