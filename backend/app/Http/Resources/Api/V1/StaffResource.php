<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StaffResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'role'       => $this->role,
            'timezone'   => $this->timezone,
            'is_active'  => is_null($this->deleted_at),
            'created_at' => $this->created_at->toDateString(),

            // CC stats — loaded via withCount
            'stats' => $this->when(
                isset($this->total_leads),
                fn() => [
                    'total_leads'            => $this->total_leads            ?? 0,
                    'conversions_this_month' => $this->conversions_this_month ?? 0,
                    'working_leads'          => $this->working_leads          ?? 0,
                    'conversion_rate'        => $this->conversion_rate        ?? 0,
                    'last_remark_at'         => $this->last_remark_at         ?? null,
                ]
            ),

            // Teacher profile — eager loaded
            'teacher_profile' => $this->when(
                $this->relationLoaded('teacher') && $this->teacher,
                fn() => new TeacherProfileResource($this->teacher)
            ),
        ];
    }
}
