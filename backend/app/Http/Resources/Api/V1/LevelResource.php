<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LevelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'code'           => $this->code,
            'name'           => $this->name,
            'name_en'        => $this->name_en,
            'description'    => $this->description,
            'order'          => $this->order,
            'total_units'    => $this->total_units,
            'total_lessons'  => $this->total_lessons,
            'is_active'      => $this->is_active,

            // Loaded only when explicitly requested (e.g. ?include=units)
            'units'          => UnitResource::collection($this->whenLoaded('units')),
        ];
    }
}
