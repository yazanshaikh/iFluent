<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SessionResource;
use App\Models\Session;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SessionController extends Controller
{
    // ─── List Student Sessions ────────────────────────────────────────────────

    public function index(Request $request): AnonymousResourceCollection
    {
        $sessions = Session::forStudent($request->user()->id)
            ->with(['lesson.unit.level', 'teacher'])
            ->when(
                $request->filled('status'),
                fn($q) => $q->where('status', $request->status)
            )
            // Hide completed/cancelled sessions older than 24 hours
            ->where(function ($q) {
                $q->whereNotIn('status', [Session::STATUS_COMPLETED, Session::STATUS_CANCELLED])
                  ->orWhere('ended_at', '>=', now()->subDay());
            })
            ->orderByDesc('scheduled_at')
            ->paginate(20);

        return SessionResource::collection($sessions);
    }

    // ─── Session Profile ──────────────────────────────────────────────────────

    /**
     * Full profile data for a session — shown on the "بروفايل الحصة" screen.
     * Accessible regardless of session status (all statuses).
     * Returns:
     *   - lesson info (title, unit, level, pdf_url)
     *   - session status + timestamps
     *   - quiz_unlocked: true only when completed + 10 min since both joined
     */
    public function profile(Session $session, Request $request): JsonResponse
    {
        if ($session->student_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $session->loadMissing('teacher.teacher'); // load teacher profile for teacher_code
        $lesson = $session->lesson()->with(['unit.level', 'level'])->first();

        // Activity unlock: session completed (no score/pass requirement)
        // No 60% pass mark — activity unlocks as soon as session is done
        $quizUnlocked = $session->isCompleted();

        $lessonData = [
            'id'            => $lesson?->id,
            'title'         => $lesson?->title,
            'is_assessment' => $lesson?->is_assessment ?? false,
            'pdf_url'       => $lesson?->pdf_url,
        ];

        if ($lesson && !$lesson->is_assessment && $lesson->unit) {
            $lessonData['order'] = $lesson->order;
            $lessonData['unit']  = ['id' => $lesson->unit->id, 'name' => $lesson->unit->name];
            $lessonData['level'] = [
                'id'   => $lesson->unit->level->id,
                'code' => $lesson->unit->level->code,
                'name' => $lesson->unit->level->name,
            ];
        } elseif ($lesson?->level) {
            $lessonData['level'] = [
                'id'   => $lesson->level->id,
                'code' => $lesson->level->code,
                'name' => $lesson->level->name,
            ];
        }

        return response()->json([
            'id'                => $session->id,
            'status'            => $session->status,
            'attendance_status' => $session->attendance_status,
            'scheduled_at'      => $session->scheduled_at?->toIso8601String(),
            'started_at'        => $session->started_at?->toIso8601String(),
            'ended_at'          => $session->ended_at?->toIso8601String(),
            'teacher'           => $session->teacher ? [
                'name'         => $session->teacher->name,
                'teacher_code' => $session->teacher->teacher?->teacher_code,
            ] : null,
            'lesson'            => $lessonData,
            'quiz_unlocked'     => $quizUnlocked,
        ]);
    }

    // ─── Join Session ─────────────────────────────────────────────────────────

    /**
     * Student taps "Join":
     * Returns the split-screen data needed by the mobile app:
     *   - daily_room_url  → passed to @daily-co/react-native-daily-js
     *   - nearpod_pin     → entered into Nearpod WebView
     *   - nearpod_url     → URL for the Nearpod WebView
     *
     * Guards:
     *   - Session must belong to this student
     *   - Session must be active
     *   - PIN must already be set by the teacher
     */
    public function join(Session $session, Request $request): JsonResponse
    {
        // Verify ownership
        if ($session->student_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Only active sessions can be joined
        if (!$session->isActive()) {
            return response()->json([
                'message' => $session->isWaiting()
                    ? 'Session has not started yet. Please wait for your teacher.'
                    : 'This session is no longer active.',
            ], 422);
        }

        // PIN must be set — teacher enters it after launching Nearpod
        if (empty($session->nearpod_pin)) {
            return response()->json([
                'message' => 'Teacher is setting up the Nearpod session. Please try again in a moment.',
            ], 425); // 425 Too Early
        }

        // Record that the student has entered the session (for commission calculation)
        if (!$session->student_joined_at) {
            $session->update(['student_joined_at' => now()]);
        }

        $lesson = $session->lesson()->with(['unit.level', 'level'])->first();

        $lessonData = [
            'id'            => $lesson->id,
            'title'         => $lesson->title,
            'is_assessment' => $lesson->is_assessment,
        ];

        if ($lesson->is_assessment) {
            // Assessment: belongs to a level, no unit
            $lessonData['level'] = [
                'id'   => $lesson->level->id,
                'code' => $lesson->level->code,
                'name' => $lesson->level->name,
            ];
        } else {
            // Regular: belongs to a unit within a level
            $lessonData['order'] = $lesson->order;
            $lessonData['unit']  = [
                'id'    => $lesson->unit->id,
                'name'  => $lesson->unit->name,
                'order' => $lesson->unit->order,
            ];
            $lessonData['level'] = [
                'id'   => $lesson->unit->level->id,
                'code' => $lesson->unit->level->code,
                'name' => $lesson->unit->level->name,
            ];
        }

        return response()->json([
            'session_id'     => $session->id,
            'status'         => $session->status,
            'daily_room_url' => $session->daily_room_url,
            'nearpod_pin'    => $session->nearpod_pin,
            'nearpod_url'    => $lesson->nearpod_url,
            'lesson'         => $lessonData,
            'teacher'        => ['name' => $session->teacher->name],
        ]);
    }
}
