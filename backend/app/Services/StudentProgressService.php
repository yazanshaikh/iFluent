<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\Session;
use App\Models\Student;
use App\Models\StudentProgress;
use App\Models\Subscription;
use App\Models\User;

/**
 * Single source of truth for a student's progress summary.
 * Used by the student app (التقدم screen) AND the CRM student profile so both
 * always show identical numbers.
 */
class StudentProgressService
{
    public function summary(User $user): array
    {
        $passedQuizzes = StudentProgress::where('student_id', $user->id)
            ->where('passed', true)
            ->count();

        $fullMarkQuizzes = StudentProgress::where('student_id', $user->id)
            ->where('score', 100)
            ->count();

        // ── Program lessons = active, non-assessment lessons in the active sub ──
        // completed_lessons and total_lessons are counted over the SAME set.
        $programLessonIds = [];
        $profile = Student::where('user_id', $user->id)->first();
        if ($profile) {
            $sub = Subscription::where('student_id', $profile->id)
                ->where('status', Subscription::STATUS_ACTIVE)
                ->whereNotNull('from_lesson_id')
                ->whereNotNull('to_lesson_id')
                ->latest('activated_at')
                ->first();

            if ($sub) {
                $lo = min($sub->from_lesson_id, $sub->to_lesson_id);
                $hi = max($sub->from_lesson_id, $sub->to_lesson_id);
                $programLessonIds = Lesson::whereBetween('id', [$lo, $hi])
                    ->where('is_active', true)
                    ->where('is_assessment', false)
                    ->pluck('id')
                    ->all();
            }
        }

        $totalLessons = count($programLessonIds);

        $completedLessons = $totalLessons > 0
            ? StudentProgress::where('student_id', $user->id)
                ->where('lesson_completed', true)
                ->whereIn('lesson_id', $programLessonIds)
                ->count()
            : 0;

        $overallPct = $totalLessons > 0
            ? min(100, (int) round($completedLessons / $totalLessons * 100))
            : 0;

        // ── Learning minutes = sum of attended live-session durations ──────────
        $attendedSessions = Session::where('student_id', $user->id)
            ->where('status', Session::STATUS_COMPLETED)
            ->where('attendance_status', Session::ATTENDANCE_ATTENDED)
            ->whereNotNull('student_joined_at')
            ->whereNotNull('ended_at')
            ->get(['student_joined_at', 'ended_at']);

        $learningMinutes = 0;
        foreach ($attendedSessions as $s) {
            $learningMinutes += $s->student_joined_at->diffInMinutes($s->ended_at);
        }
        $learningMinutes = (int) round($learningMinutes);

        // ── Lessons the student was absent from (student no-show) ──────────────
        $absentSessions = Session::where('student_id', $user->id)
            ->where('status', Session::STATUS_COMPLETED)
            ->where('attendance_status', Session::ATTENDANCE_ABSENT)
            ->count();

        // ── Achievements (all derived from the metrics above) ──────────────────
        $halfProgram = $totalLessons > 0 ? (int) ceil($totalLessons / 2) : PHP_INT_MAX;

        $achievements = [
            ['id' => 1,  'earned' => $completedLessons >= 1],
            ['id' => 2,  'earned' => $completedLessons >= 5],
            ['id' => 3,  'earned' => $completedLessons >= 10],
            ['id' => 4,  'earned' => $completedLessons >= 20],
            ['id' => 5,  'earned' => $totalLessons > 0 && $completedLessons >= $halfProgram],
            ['id' => 6,  'earned' => $completedLessons >= 50],
            ['id' => 7,  'earned' => $completedLessons >= 100],
            ['id' => 8,  'earned' => $totalLessons > 0 && $completedLessons >= $totalLessons],
            ['id' => 9,  'earned' => $learningMinutes >= 30],
            ['id' => 10, 'earned' => $learningMinutes >= 60],
            ['id' => 11, 'earned' => $learningMinutes >= 300],
            ['id' => 12, 'earned' => $fullMarkQuizzes >= 3],
        ];

        $earnedCount = count(array_filter($achievements, fn ($a) => $a['earned']));

        return [
            'overall_pct'       => $overallPct,
            'completed_lessons' => $completedLessons,
            'total_lessons'     => $totalLessons,
            'learning_minutes'  => $learningMinutes,
            'absent_sessions'   => $absentSessions,
            'passed_quizzes'    => $passedQuizzes,
            'full_mark_quizzes' => $fullMarkQuizzes,
            'earned_badges'     => $earnedCount,
            'total_badges'      => count($achievements),
            'achievements'      => $achievements,
        ];
    }
}
