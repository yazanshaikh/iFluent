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
            'staff' => [
                'id'   => $this->staff->id,
                'name' => $this->staff->name,
            ],
            // Jordan timezone for display (PRD 8.2)
            'created_at' => $this->created_at
                ->setTimezone('Asia/Amman')
                ->format('Y-m-d H:i'),
        ];
    }
}
