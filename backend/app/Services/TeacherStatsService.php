<?php

namespace App\Services;

use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

/**
 * The one place a teacher's session counts and balance are calculated
 * (CRM staff profile, teacher app profile, teacher login).
 *
 *   total sessions = attended trial + attended regular
 *   balance        = sessions since the balance reset × session rate
 *                  + conversion points since the balance reset × conversion rate
 *                  + group classes since the balance reset × group rate
 *
 * Conversion points and group classes each have their own count and commission
 * and are not part of the total sessions.
 */
class TeacherStatsService
{
    /**
     * @return array{trial_sessions:int, regular_sessions:int, conversion_points:int,
     *               group_sessions:int, sessions_count:int, absences_count:int,
     *               session_commission:float, conversion_commission:float,
     *               group_commission:float, balance:float}
     */
    public function forTeacher(Teacher $teacher): array
    {
        [$trial, $regular] = $this->attendedByType($teacher->user_id, $teacher->sessions_count_reset_at);
        $points = $this->conversionPoints($teacher->user_id, $teacher->sessions_count_reset_at);
        $groups = $this->groupClasses($teacher->user_id, $teacher->sessions_count_reset_at);

        $absences = $this->completedSessions($teacher->user_id)
            ->where('attendance_status', 'teacher_absent')
            ->when($teacher->absences_reset_at, fn ($q, $at) => $q->where('ended_at', '>', $at))
            ->count();

        // The balance has its own reset date, so it is counted separately.
        [$balanceTrial, $balanceRegular] = $this->attendedByType($teacher->user_id, $teacher->balance_reset_at);
        $balancePoints = $this->conversionPoints($teacher->user_id, $teacher->balance_reset_at);

        $sessionCommission    = ($balanceTrial + $balanceRegular) * (float) $teacher->commission_rate;
        $conversionCommission = $balancePoints * (float) $teacher->conversion_commission_rate;
        $groupCommission      = $this->groupClasses($teacher->user_id, $teacher->balance_reset_at)
            * (float) $teacher->group_commission_rate;

        return [
            'trial_sessions'    => $trial,
            'regular_sessions'  => $regular,
            'conversion_points' => $points,
            'group_sessions'    => $groups,
            'sessions_count'    => $trial + $regular,
            'absences_count'    => $absences,
            'session_commission'    => $sessionCommission,
            'conversion_commission' => $conversionCommission,
            'group_commission'      => $groupCommission,
            'balance'               => $sessionCommission + $conversionCommission + $groupCommission,
        ];
    }

    private function completedSessions(int $teacherUserId)
    {
        return DB::table('sessions')
            ->where('sessions.teacher_id', $teacherUserId)
            ->where('sessions.status', 'completed');
    }

    /** @return array{0:int,1:int} [attended trial sessions, attended regular sessions] */
    private function attendedByType(int $teacherUserId, $since): array
    {
        $rows = $this->completedSessions($teacherUserId)
            ->leftJoin('lessons', 'lessons.id', '=', 'sessions.lesson_id')
            ->where('sessions.attendance_status', 'attended')
            ->when($since, fn ($q, $at) => $q->where('sessions.ended_at', '>', $at))
            ->selectRaw('COALESCE(lessons.is_assessment, false) AS is_trial, COUNT(*) AS total')
            ->groupByRaw('COALESCE(lessons.is_assessment, false)')
            ->get();

        $trial   = (int) ($rows->firstWhere('is_trial', true)->total ?? 0);
        $regular = (int) ($rows->firstWhere('is_trial', false)->total ?? 0);

        return [$trial, $regular];
    }

    /** Completed group classes that had at least one registered student. */
    private function groupClasses(int $teacherUserId, $since): int
    {
        return DB::table('group_classes')
            ->where('teacher_id', $teacherUserId)
            ->where('status', 'completed')
            ->where('registered_count', '>', 0)
            ->whereNull('deleted_at')
            ->when($since, fn ($q, $at) => $q->where('ended_at', '>', $at))
            ->count();
    }

    private function conversionPoints(int $teacherUserId, $since): int
    {
        return DB::table('teacher_conversion_points')
            ->where('teacher_id', $teacherUserId)
            ->when($since, fn ($q, $at) => $q->where('awarded_at', '>', $at))
            ->count();
    }
}
