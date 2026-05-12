<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'status'            => $this->status,
            'amount_paid'       => $this->amount_paid,
            'payment_method'    => $this->payment_method,
            'payment_reference' => $this->payment_reference,

            // Screenshot URL — only for admin and the CC who submitted
            'payment_screenshot_url' => $this->resolveScreenshotUrl($request),

            'package' => $this->when($this->relationLoaded('package'), fn() => [
                'id'    => $this->package->id,
                'name'  => $this->package->name,
                'price' => $this->package->price,
            ]),

            'student' => $this->when($this->relationLoaded('student'), fn() => [
                'id'   => $this->student->id,
                'name' => $this->student->user->name ?? null,
            ]),

            // Audit trail (PRD 5.4.5)
            'submitted_by' => $this->when($this->relationLoaded('activatedBy'), fn() => [
                'id'   => $this->activatedBy?->id,
                'name' => $this->activatedBy?->name,
            ]),
            'approved_by' => $this->when($this->relationLoaded('approvedBy'), fn() => [
                'id'   => $this->approvedBy?->id,
                'name' => $this->approvedBy?->name,
            ]),

            'activated_at' => $this->activated_at?->toIso8601String(),
            'approved_at'  => $this->approved_at?->toIso8601String(),
            'expires_at'   => $this->expires_at?->toIso8601String(),
            'created_at'   => $this->created_at->toIso8601String(),
        ];
    }

    private function resolveScreenshotUrl(Request $request): ?string
    {
        if (!$this->payment_screenshot) return null;

        $user = $request->user();
        if (!$user) return null;

        if ($user->isSuperAdmin()) {
            return route('admin.subscription.screenshot', $this->id);
        }
        if ($user->isCC() && $this->activated_by === $user->id) {
            return route('admin.subscription.screenshot', $this->id);
        }

        return null;
    }
}
