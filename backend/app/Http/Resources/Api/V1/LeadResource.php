<?php

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
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

            'assigned_to' => $this->when($this->relationLoaded('assignedTo'), fn() => [
                'id'   => $this->assignedTo?->id,
                'name' => $this->assignedTo?->name,
            ]),

            'remarks_count'       => $this->when(isset($this->remarks_count), $this->remarks_count),
            'remarks'             => LeadRemarkResource::collection($this->whenLoaded('remarks')),

            'moved_to_open_sea_at' => $this->moved_to_open_sea_at?->toIso8601String(),
            'converted_at'         => $this->converted_at?->toIso8601String(),
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
