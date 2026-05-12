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
            ->orderByDesc('scheduled_at')
            ->paginate(20);

        return SessionResource::collection($sessions);
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
