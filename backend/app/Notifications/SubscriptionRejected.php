<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SubscriptionRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Subscription $subscription,
        public readonly ?string $reason = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'       => 'subscription_rejected',
            'message'    => 'تم رفض طلب الاشتراك' . ($this->reason ? ": {$this->reason}" : '.'),
            'package_id' => $this->subscription->package_id,
            'reason'     => $this->reason,
        ];
    }
}
