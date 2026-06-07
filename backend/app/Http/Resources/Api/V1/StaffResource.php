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
            'is_active'   => is_null($this->deleted_at),
            'created_at'  => $this->created_at->toDateString(),
            'leads_count' => $this->assigned_leads_count ?? null,

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
            'teacher_profile' => $this->buildTeacherProfile(),
        ];
    }

    private function buildTeacherProfile(): ?array
    {
        $teacher = $this->resource->teacher ?? null;
        if (!$teacher) return null;

        $baseAll = \DB::table('sessions')
            ->where('teacher_id', $this->id)
            ->where('status', 'completed');

        // sessions_count: since last sessions reset
        $baseSessions = (clone $baseAll);
        if ($teacher->sessions_count_reset_at) {
            $baseSessions->where('ended_at', '>', $teacher->sessions_count_reset_at);
        }
        $sessionsCount = (clone $baseSessions)->where('attendance_status', 'attended')->count();

        // absences_count: since last absences reset
        $baseAbsences = (clone $baseAll);
        if ($teacher->absences_reset_at) {
            $baseAbsences->where('ended_at', '>', $teacher->absences_reset_at);
        }
        $absencesCount = (clone $baseAbsences)->where('attendance_status', 'teacher_absent')->count();

        // balance: sessions since last balance reset × commission_rate
        $commissionRate = (float) $teacher->commission_rate;
        $baseBalance    = (clone $baseAll)->where('attendance_status', 'attended');
        if ($teacher->balance_reset_at) {
            $baseBalance->where('ended_at', '>', $teacher->balance_reset_at);
        }
        $balance = (clone $baseBalance)->count() * $commissionRate;

        $avgRating = \DB::table('session_ratings')->where('teacher_id', $this->id)->avg('rating');

        return [
            'teacher_code'            => $teacher->teacher_code,
            'bio'                     => $teacher->bio,
            'specialization'          => $teacher->specialization,
            'profile_photo'           => $teacher->profile_photo,
            'commission_rate'         => $commissionRate,
            'balance'                 => $balance,
            'is_active'               => $teacher->is_active,
            'sessions_count'          => $sessionsCount,
            'absences_count'          => $absencesCount,
            'avg_rating'              => $avgRating ? round($avgRating, 1) : null,
            'sessions_count_reset_at' => $teacher->sessions_count_reset_at?->toDateTimeString(),
            'balance_reset_at'        => $teacher->balance_reset_at?->toDateTimeString(),
            'absences_reset_at'       => $teacher->absences_reset_at?->toDateTimeString(),
        ];
    }
}
