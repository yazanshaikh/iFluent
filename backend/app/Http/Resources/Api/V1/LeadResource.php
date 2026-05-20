<?php

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    // بدون data wrapper — الفرونت يقرأ الحقول مباشرة (r.data.id, r.data.name …)
    // الـ collection wrapping (index) لا تتأثر — يبقى { data: [], meta: {} }
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $viewer = $request->user();

        return [
            'id'                  => $this->id,
            'name'                => $this->name,

            // Phone: full for admin/CC, masked for everyone else (PRD 5.5)
            'phone'               => $this->resolvePhone($viewer),

            'source'              => $this->source,
            'age'                 => $this->age,
            'status'              => $this->status,
            'is_small_treasure'   => $this->is_small_treasure,

            'assigned_to' => $this->when($this->relationLoaded('assignedTo'), fn() => $this->assignedTo ? [
                'id'   => $this->assignedTo->id,
                'name' => $this->assignedTo->name,
                'role' => $this->assignedTo->role,
            ] : null),

            'remarks_count'       => $this->when(isset($this->remarks_count), $this->remarks_count),
            'remarks'             => LeadRemarkResource::collection($this->whenLoaded('remarks')),

            'demo_session' => $this->when(
                $this->relationLoaded('latestDemoSession') && $this->latestDemoSession,
                fn() => [
                    'id'           => $this->latestDemoSession->id,
                    'status'       => $this->latestDemoSession->status,
                    'scheduled_at' => $this->latestDemoSession->requested_at_utc?->toIso8601String(),
                ]
            ),

            'moved_to_open_sea_at' => $this->moved_to_open_sea_at?->toIso8601String(),
            'converted_at'         => $this->converted_at?->toIso8601String(),
            'converted_by'         => $this->when(
                $this->status === 'subscriber' && $this->relationLoaded('student'),
                function () {
                    $sub = $this->student?->subscriptions?->sortByDesc('id')->first();
                    if (!$sub?->activatedBy) return null;
                    return ['id' => $sub->activatedBy->id, 'name' => $sub->activatedBy->name];
                }
            ),
            'created_at'           => $this->created_at->toIso8601String(),
        ];
    }

    private function resolvePhone(?User $viewer): string
    {
        if (!$viewer) return $this->maskPhone($this->phone);

        if ($viewer->isSuperAdmin()) return $this->phone;

        // CC staff sees phone only for their own leads
        if ($viewer->isCC() && $this->assigned_to === $viewer->id) {
            return $this->phone;
        }

        return $this->maskPhone($this->phone);
    }

    private function maskPhone(string $phone): string
    {
        // Show first 4 and last 2 digits: 009627*****67
        if (strlen($phone) <= 6) return '***';
        return substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 6) . substr($phone, -2);
    }
}
