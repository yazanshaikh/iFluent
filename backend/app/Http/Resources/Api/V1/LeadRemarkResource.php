<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadRemarkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'content'    => $this->content,
            // System-generated remarks (e.g. the landing-page booking note) have
            // no staff author (staff_id = null) → staff is null. Return null
            // instead of dereferencing it (was a 500 on any lead with such a remark).
            'staff' => $this->staff ? [
                'id'   => $this->staff->id,
                'name' => $this->staff->name,
                'role' => $this->staff->role,
            ] : null,
            // Jordan timezone for display (PRD 8.2)
            'created_at' => $this->created_at
                ->setTimezone('Asia/Amman')
                ->format('Y-m-d H:i'),
        ];
    }
}
