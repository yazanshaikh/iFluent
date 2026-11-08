<?php

namespace App\Http\Resources\Api\V1;

use App\Services\TeacherStatsService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $stats = app(TeacherStatsService::class)->forTeacher($this->resource);

        $avgRating = \DB::table('session_ratings')->where('teacher_id', $this->user_id)->avg('rating');
        $avgRating = $avgRating ? round($avgRating, 1) : null;

        return [
            'teacher_code'            => $this->teacher_code,
            'bio'                     => $this->bio,
            'specialization'          => $this->specialization,
            'profile_photo'           => $this->profile_photo,
            'commission_rate'         => $this->commission_rate,
            'balance'                 => $stats['balance'],
            'is_active'               => $this->is_active,
            'zoom_connected'          => !is_null($this->zoom_user_id),
            'sessions_count'          => $stats['sessions_count'],
            'absences_count'          => $stats['absences_count'],
            'avg_rating'              => $avgRating,
            'sessions_count_reset_at' => $this->sessions_count_reset_at
                ? $this->sessions_count_reset_at->toDateTimeString()
                : null,
        ];
    }
}
