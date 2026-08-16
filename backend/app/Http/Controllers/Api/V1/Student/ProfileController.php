<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Student;
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
        // Nullable so the client can CLEAR the token (notifications turned off).
        $request->validate(['fcm_token' => ['present', 'nullable', 'string']]);
        $request->user()->update(['fcm_token' => $request->fcm_token ?: null]);
        return response()->json(['message' => 'Device token updated.']);
    }

    /**
     * Student requests account deletion — creates a system remark on their lead.
     *
     * POST /api/v1/student/account-deletion-request
     * Body: { reason: string }
     */
    public function requestAccountDeletion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $user    = $request->user();
        $student = Student::where('user_id', $user->id)->first();

        $lead = null;
        if ($student?->lead_id) {
            $lead = Lead::find($student->lead_id);
        }
        if (!$lead) {
            $lead = Lead::findByPhoneFlexible($user->phone);
        }
        if (!$lead) {
            $lead = Lead::firstOrCreate(
                ['phone' => $user->phone],
                [
                    'name'   => $user->name,
                    'source' => 'app',
                    'status' => Lead::STATUS_NEW,
                ],
            );
        }

        if ($student && !$student->lead_id) {
            $student->update(['lead_id' => $lead->id]);
        }

        $lead->remarks()->create([
            'staff_id' => null,
            'content'  => "🗑️ طلب حذف حساب من تطبيق الطالب\n"
                . "📱 الرقم: {$user->phone}\n"
                . "📝 السبب: {$validated['reason']}",
        ]);

        return response()->json([
            'message' => 'تم إرسال طلبك. سيتم مراجعة طلبك قريباً.',
        ]);
    }
}
