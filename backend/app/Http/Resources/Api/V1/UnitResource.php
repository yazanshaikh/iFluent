<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'level_id'     => $this->level_id,
            'name'         => $this->name,
            'name_en'      => $this->name_en,
            'order'        => $this->order,
            'lesson_count' => $this->lesson_count,
            'has_end_test' => $this->has_end_test,
            'is_active'    => $this->is_active,

            // Pivot data when unit is loaded via student's enrolledUnits
            'enrollment'   => $this->when(
                isset($this->pivot),
                fn() => [
                    'status'       => $this->pivot->status,
                    'enrolled_at'  => $this->pivot->enrolled_at,
                    'completed_at' => $this->pivot->completed_at,
                    'expires_at'   => $this->pivot->expires_at,
                ]
            ),

            // Nested lessons — only when explicitly loaded
            'lessons'      => LessonResource::collection($this->whenLoaded('lessons')),
        ];
    }
}
