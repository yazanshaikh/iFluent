<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $query = \DB::table('sessions')->where('teacher_id', $this->user_id);
        if ($this->sessions_count_reset_at) {
            $query->where('created_at', '>', $this->sessions_count_reset_at);
        }
        $sessionsCount = $query->count();

        $avgRating = \DB::table('session_ratings')->where('teacher_id', $this->user_id)->avg('rating');
        $avgRating = $avgRating ? round($avgRating, 1) : null;

        return [
            'teacher_code'            => $this->teacher_code,
            'bio'                     => $this->bio,
            'specialization'          => $this->specialization,
            'profile_photo'           => $this->profile_photo,
            'commission_rate'         => $this->commission_rate,
            'balance'                 => $this->balance,
            'is_active'               => $this->is_active,
            'zoom_connected'          => !is_null($this->zoom_user_id),
            'sessions_count'          => $sessionsCount,
            'avg_rating'              => $avgRating,
            'sessions_count_reset_at' => $this->sessions_count_reset_at
                ? $this->sessions_count_reset_at->toDateTimeString()
                : null,
        ];
    }
}
