<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\SessionRating;
use App\Models\Teacher;
use App\Models\TeacherAvailability;
use Illuminate\Http\JsonResponse;

/**
 * Student views a teacher's public profile.
 *
 * Accessible via teacher_code (the unique ID displayed in the teacher's app).
 * Phone number is NEVER exposed (privacy rule from PRD).
 *
 * Profile includes:
 *   - Name, bio, specialization, profile photo
 *   - teacher_code (for booking private sessions)
 *   - Average rating + total sessions completed
 *   - Weekly availability schedule (in UTC, client converts to Jordan Time)
 */
class TeacherProfileController extends Controller
{
    public function show(string $teacherCode): JsonResponse
    {
        $teacher = Teacher::where('teacher_code', $teacherCode)
            ->where('is_active', true)
            ->with('user:id,name')
            ->first();

        if (!$teacher) {
            return response()->json(['message' => 'Teacher not found.'], 404);
        }

        // Average rating
        $ratingStats = SessionRating::forTeacher($teacher->user_id)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total_ratings')
            ->first();

        $avgRating    = $ratingStats->avg_rating ? round((float) $ratingStats->avg_rating, 1) : null;
        $totalRatings = (int) $ratingStats->total_ratings;

        // Completed sessions count (public stat)
        $completedSessions = \App\Models\Session::where('teacher_id', $teacher->user_id)
            ->where('status', 'completed')
            ->count();

        // Weekly availability
        $availability = TeacherAvailability::forTeacher($teacher->user_id)
            ->active()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'teacher' => [
                'teacher_code'      => $teacher->teacher_code,
                'name'              => $teacher->user?->name,
                'bio'               => $teacher->bio,
                'specialization'    => $teacher->specialization,
                'profile_photo'     => $teacher->profile_photo
                    ? url('storage/' . $teacher->profile_photo)
                    : null,
                'avg_rating'        => $avgRating,
                'total_ratings'     => $totalRatings,
                'sessions_completed'=> $completedSessions,
                // NOTE: phone number intentionally omitted (PRD privacy rule)
            ],
            'availability' => $availability->map(fn($s) => [
                'day_of_week' => $s->day_of_week,
                'day_name'    => $s->day_name,
                'start_time'  => $s->start_time, // UTC — client converts to Jordan Time
                'end_time'    => $s->end_time,
            ]),
        ]);
    }
}
