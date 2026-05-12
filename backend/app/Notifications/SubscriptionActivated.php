<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SubscriptionActivated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Subscription $subscription) {}

    public function via(object $notifiable): array
    {
        // TODO: add 'fcm' channel when Firebase is wired up (Phase 2)
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'         => 'subscription_activated',
            'message'      => 'تم تفعيل اشتراكك في حزمة ' . $this->subscription->package->name,
            'package_id'   => $this->subscription->package_id,
            'package_name' => $this->subscription->package->name,
            'activated_at' => $this->subscription->activated_at?->toIso8601String(),
        ];
    }
}
