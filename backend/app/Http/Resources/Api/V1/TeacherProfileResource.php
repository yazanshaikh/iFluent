<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $baseAll = \DB::table('sessions')
            ->where('teacher_id', $this->user_id)
            ->where('status', 'completed');

        // sessions_count since last reset
        $baseSessions = (clone $baseAll);
        if ($this->sessions_count_reset_at) {
            $baseSessions->where('ended_at', '>', $this->sessions_count_reset_at);
        }
        $sessionsCount = (clone $baseSessions)->where('attendance_status', 'attended')->count();

        // absences_count since last absences reset
        $baseAbsences = (clone $baseAll);
        if ($this->absences_reset_at) {
            $baseAbsences->where('ended_at', '>', $this->absences_reset_at);
        }
        $absencesCount = (clone $baseAbsences)->where('attendance_status', 'teacher_absent')->count();

        // balance = sessions since last balance reset × commission_rate
        $commissionRate = (float) $this->commission_rate;
        $baseBalance    = (clone $baseAll)->where('attendance_status', 'attended');
        if ($this->balance_reset_at) {
            $baseBalance->where('ended_at', '>', $this->balance_reset_at);
        }
        $balance = (clone $baseBalance)->count() * $commissionRate;

        $avgRating = \DB::table('session_ratings')->where('teacher_id', $this->user_id)->avg('rating');
        $avgRating = $avgRating ? round($avgRating, 1) : null;

        return [
            'teacher_code'            => $this->teacher_code,
            'bio'                     => $this->bio,
            'specialization'          => $this->specialization,
            'profile_photo'           => $this->profile_photo,
            'commission_rate'         => $this->commission_rate,
            'balance'                 => $balance,
            'is_active'               => $this->is_active,
            'zoom_connected'          => !is_null($this->zoom_user_id),
            'sessions_count'          => $sessionsCount,
            'absences_count'          => $absencesCount,
            'avg_rating'              => $avgRating,
            'sessions_count_reset_at' => $this->sessions_count_reset_at
                ? $this->sessions_count_reset_at->toDateTimeString()
                : null,
        ];
    }
}
