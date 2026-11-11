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

    /**
     * Plans are sold by lessons now, not packages — a subscription usually has
     * no package, so the message is built from the lessons and the plan type.
     */
    public function toDatabase(object $notifiable): array
    {
        $sub   = $this->subscription;
        $type  = $sub->subscription_type === Subscription::TYPE_GROUP ? 'حصص جماعية' : 'حصص فردية';
        $plan  = $sub->package?->name
            ?? ($sub->lessons_count ? "{$sub->lessons_count} درس — {$type}" : $type);

        return [
            'type'              => 'subscription_activated',
            'message'           => 'تم تفعيل اشتراكك: ' . $plan,
            'package_id'        => $sub->package_id,
            'package_name'      => $plan,
            'subscription_type' => $sub->subscription_type,
            'lessons_count'     => $sub->lessons_count,
            'activated_at'      => $sub->activated_at?->toIso8601String(),
        ];
    }
}
