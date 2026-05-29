<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Student profile: name, timezone, FCM token, progress summary.
 */
class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user    = $request->user();
        $student = $user->student;

        // Progress summary
        $completedLessons = StudentProgress::where('student_id', $user->id)
            ->where('lesson_completed', true)->count();

        $passedQuizzes = StudentProgress::where('student_id', $user->id)
            ->where('passed', true)->count();

        return response()->json([
            'profile' => [
                'name'              => $user->name,
                'phone'             => $user->phone,
                'timezone'          => $user->timezone,
                'lesson_credits'    => (int) $user->lesson_credits,
                'completed_lessons' => $completedLessons,
                'passed_quizzes'    => $passedQuizzes,
                'enrolled_units'    => $user->enrolledUnits()->where('status', 'active')->count(),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['sometimes', 'string', 'max:100'],
            'timezone' => ['sometimes', 'string', 'timezone'],
        ]);

        $request->user()->update($validated);

        return response()->json(['message' => 'Profile updated.']);
    }

    public function updateFcmToken(Request $request): JsonResponse
    {
        $request->validate(['fcm_token' => ['required', 'string']]);
        $request->user()->update(['fcm_token' => $request->fcm_token]);
        return response()->json(['message' => 'Device token registered.']);
    }
}
