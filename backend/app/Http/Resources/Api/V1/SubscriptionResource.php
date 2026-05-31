<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'invoice_uuid' => $this->invoice_uuid,
            'invoice_url'  => $this->invoice_uuid ? "/pay/{$this->invoice_uuid}" : null,
            'status'          => $this->status,
            'lessons_count'   => $this->lessons_count,
            'months_count'    => $this->months_count,
            'amount_paid'     => $this->amount_paid,
            'from_lesson_id'  => $this->from_lesson_id,
            'to_lesson_id'    => $this->to_lesson_id,

            // Legacy fields (kept for backward compatibility)
            'payment_method'    => $this->payment_method,
            'payment_reference' => $this->payment_reference,

            // Screenshot URL — only for admin and the CC who submitted
            'payment_screenshot_url' => $this->resolveScreenshotUrl($request),

            'payment_account' => $this->when(
                $this->relationLoaded('paymentAccount') && $this->paymentAccount,
                fn() => [
                    'alias'     => $this->paymentAccount->alias,
                    'cliq_name' => $this->paymentAccount->cliq_name,
                ]
            ),

            'student' => $this->when($this->relationLoaded('student'), fn() => [
                'id'   => $this->student->id,
                'name' => $this->student->user->name ?? null,
            ]),

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
        if (($user->isCC() || $user->isSS()) && $this->activated_by === $user->id) {
            return route('admin.subscription.screenshot', $this->id);
        }

        return null;
    }
}
