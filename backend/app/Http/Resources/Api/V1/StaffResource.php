<?php

namespace App\Http\Resources\Api\V1;

use App\Services\TeacherStatsService;
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

        $commissionRate = (float) $teacher->commission_rate;
        $stats = app(TeacherStatsService::class)->forTeacher($teacher);

        $avgRating = \DB::table('session_ratings')->where('teacher_id', $this->id)->avg('rating');

        return [
            'teacher_code'            => $teacher->teacher_code,
            'bio'                     => $teacher->bio,
            'specialization'          => $teacher->specialization,
            'profile_photo'           => $teacher->profile_photo,
            'commission_rate'         => $commissionRate,
            'balance'                 => $stats['balance'],
            'session_commission'      => $stats['session_commission'],
            'conversion_commission'   => $stats['conversion_commission'],
            'conversion_commission_rate' => (float) $teacher->conversion_commission_rate,
            'group_commission'        => $stats['group_commission'],
            'group_commission_rate'   => (float) $teacher->group_commission_rate,
            'is_active'               => $teacher->is_active,
            'sessions_count'          => $stats['sessions_count'],      // trial + regular
            'trial_sessions'          => $stats['trial_sessions'],
            'regular_sessions'        => $stats['regular_sessions'],
            'conversion_points'       => $stats['conversion_points'],
            'group_sessions'          => $stats['group_sessions'],
            'absences_count'          => $stats['absences_count'],
            'avg_rating'              => $avgRating ? round($avgRating, 1) : null,
            'sessions_count_reset_at' => $teacher->sessions_count_reset_at?->toDateTimeString(),
            'balance_reset_at'        => $teacher->balance_reset_at?->toDateTimeString(),
            'absences_reset_at'       => $teacher->absences_reset_at?->toDateTimeString(),
        ];
    }
}
