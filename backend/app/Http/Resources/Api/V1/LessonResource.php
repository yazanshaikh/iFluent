<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id'            => $this->id,
            'level_id'      => $this->level_id,
            'unit_id'       => $this->unit_id,
            'title'         => $this->title,
            'description'   => $this->description,
            'order'         => $this->order,
            'is_assessment' => $this->is_assessment,
            'is_active'     => $this->is_active,

            // Nearpod fields — visible to teacher and admin; student gets URL at session-join time
            'nearpod_lesson_id' => $this->when(
                $user && ($user->isTeacher() || $user->isSuperAdmin()),
                $this->nearpod_lesson_id
            ),
            'nearpod_url'       => $this->when(
                $user && ($user->isTeacher() || $user->isSuperAdmin()),
                $this->nearpod_url
            ),

            'level' => new LevelResource($this->whenLoaded('level')),
            'unit'  => new UnitResource($this->whenLoaded('unit')),
        ];
    }
}
