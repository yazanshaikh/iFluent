<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'teacher_code'    => $this->teacher_code,
            'bio'             => $this->bio,
            'specialization'  => $this->specialization,
            'profile_photo'   => $this->profile_photo,
            'commission_rate' => $this->commission_rate,
            'balance'         => $this->balance,
            'is_active'       => $this->is_active,
            'zoom_connected'  => !is_null($this->zoom_user_id),
        ];
    }
}
