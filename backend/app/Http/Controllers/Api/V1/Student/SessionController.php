<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SessionResource;
use App\Models\Session;
use App\Services\SessionAttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SessionController extends Controller
{
    // ─── List Student Sessions ────────────────────────────────────────────────

    public function index(Request $request): AnonymousResourceCollection
    {
        $user  = $request->user();
        $last9 = $this->phoneLast9($user->phone);

        // The student's own sessions + any trial/assessment session booked for
        // their lead (student_id null, linked by lead_id). Lead phone is raw,
        // user phone is E.164 → match on the last 9 digits.
        $sessions = Session::where(function ($base) use ($user, $last9) {
                $base->where('student_id', $user->id);
                if ($last9) {
                    $base->orWhereHas('lead', function ($lq) use ($last9) {
                        $lq->whereRaw("RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) = ?", [$last9]);
                    });
                }
            })
            ->with(['lesson.unit.level', 'teacher'])
            ->when(
                $request->filled('status'),
                fn($q) => $q->where('status', $request->status)
            )
            // ── Visibility rules ──────────────────────────────────────────────
            // 1. NEVER show waiting sessions past their grace period (teacher didn't show)
            // → Scheduler will mark them completed, but until then hide them
            // 2. Hide completed/cancelled regular sessions older than 24h
            // 3. Always show assessment sessions
            ->where(function ($q) {
                // Exclude waiting sessions that are past their time (+15min grace)
                $q->where(function ($q2) {
                    $q2->where('status', '!=', Session::STATUS_WAITING)
                       ->orWhere('scheduled_at', '>=', now()->subMinutes(15));
                });
            })
            ->where(function ($q) {
                $q->where(function ($q2) {
                    // Regular sessions: hide completed/cancelled older than 24h
                    $q2->where(function ($q3) {
                        $q3->whereNotIn('status', [Session::STATUS_COMPLETED, Session::STATUS_CANCELLED])
                          ->orWhere('ended_at', '>=', now()->subDay());
                    })
                    ->whereHas('lesson', fn($l) => $l->where('is_assessment', false));
                })
                ->orWhereHas('lesson', fn($l) => $l->where('is_assessment', true));
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
     * - lesson info (title, unit, level, pdf_url)
     * - session status + timestamps
     * - quiz_unlocked: true only when completed + 10 min since both joined
     */
    public function profile(Session $session, Request $request): JsonResponse
    {
        if (! $this->ownsSession($session, $request->user())) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $session->loadMissing('teacher.teacher'); // load teacher profile for teacher_code
        $lesson = $session->lesson()->with(['unit.level', 'level'])->first();

        // Activity unlock: ONLY when attended (both present 10+ min)
        // absent or teacher_absent → stays locked
        $quizUnlocked = $session->isCompleted()
            && $session->attendance_status === Session::ATTENDANCE_ATTENDED;

        // ── Teacher avg rating (computed live from session_ratings) ──────────
        $teacherAvgRating = null;
        $teacherTotalRatings = 0;
        if ($session->teacher_id) {
            $ratingStats = \App\Models\SessionRating::where('teacher_id', $session->teacher_id)
                ->selectRaw('ROUND(AVG(rating)::numeric, 1) as avg, COUNT(*) as total')
                ->first();
            $teacherAvgRating    = $ratingStats?->avg ? (float) $ratingStats->avg : null;
            $teacherTotalRatings = (int) ($ratingStats?->total ?? 0);
        }

        // ── Has student already rated this session? ──────────────────────────
        $existingRating = \App\Models\SessionRating::where('session_id', $session->id)->first();

        $lessonData = [
            'id'            => $lesson?->id,
            'title'         => $lesson?->title,
            'is_assessment' => $lesson?->is_assessment ?? false,
            'pdf_url'       => $lesson?->pdf_url,
            'activity_url'  => $lesson?->activity_url,
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
                'name'          => $session->teacher->name,
                'teacher_code'  => $session->teacher->teacher?->teacher_code,
                'avg_rating'    => $teacherAvgRating,      // ← avg from all sessions
                'total_ratings' => $teacherTotalRatings,   // ← how many ratings
            ] : null,
            'lesson'            => $lessonData,
            'quiz_unlocked'     => $quizUnlocked,
            // ── Rating state ─────────────────────────────────────────────────
            'rating' => $existingRating ? [
                'rated'  => true,
                'stars'  => $existingRating->rating,
                'notes'  => $existingRating->notes,
            ] : [
                'rated'  => false,
                'stars'  => null,
                'notes'  => null,
            ],
        ]);
    }

    // ─── Join Session ─────────────────────────────────────────────────────────

    /**
     * Student taps "Join":
     * Returns the split-screen data needed by the mobile app:
     * - daily_room_url  → passed to @daily-co/react-native-daily-js
     * - nearpod_pin     → entered into Nearpod WebView
     * - nearpod_url     → URL for the Nearpod WebView
     *
     * Guards:
     * - Session must belong to this student
     * - Session must be active
     * - PIN must already be set by the teacher
     */
    public function join(Session $session, Request $request): JsonResponse
    {
        // Verify ownership
        if (! $this->ownsSession($session, $request->user())) {
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

        // Mark student as PRESENT (they clicked join)
        SessionAttendanceService::markStudentPresent($session);

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

        // Rooms are PUBLIC, so the student joins WITHOUT a meeting token.
        // (Our Daily account rejects non-owner meeting tokens — passing one makes
        // the join fail even on a public room. No token = clean public join.)
        $dailyRoomUrl = $session->daily_room_url;

        return response()->json([
            'session_id'     => $session->id,
            'status'         => $session->status,
            'daily_room_url' => $dailyRoomUrl,
            'nearpod_pin'    => $session->nearpod_pin,
            // Build Nearpod URL from PIN (PIN is the join code students enter)
            'nearpod_url'    => $session->nearpod_pin
                ? 'https://nearpod.com/student/?pin=' . strtoupper($session->nearpod_pin)
                : $lesson->nearpod_url,
            'lesson'         => $lessonData,
            'teacher'        => ['name' => $session->teacher->name],
        ]);
    }

    // ─── Raise Hand ───────────────────────────────────────────────────────────

    public function raiseHand(Session $session, Request $request): \Illuminate\Http\JsonResponse
    {
        if (! $this->ownsSession($session, $request->user())) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->isActive()) {
            return response()->json(['message' => 'Session is not active.'], 422);
        }

        $data = [
            'student_name' => $request->user()->name,
            'raised_at'    => now()->toIso8601String(),
        ];

        // Store in cache for 60 seconds (teacher polls this)
        \Illuminate\Support\Facades\Cache::put(
            "raised_hand:session:{$session->id}",
            $data,
            60
        );

        // Also broadcast via WebSocket for real-time (if Reverb is running)
        try {
            broadcast(new \App\Events\StudentRaisedHand($session, $request->user()->name));
        } catch (\Throwable) {}

        return response()->json(['message' => 'Hand raised.', 'data' => $data]);
    }

    // ─── Ownership helpers ────────────────────────────────────────────────────

    /** Last 9 digits of a phone (format-agnostic), or null if too short. */
    private function phoneLast9(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);
        return strlen($digits) >= 8 ? substr($digits, -9) : null;
    }

    /**
     * A session belongs to the current user if they are its student, or it is a
     * trial/assessment booked for their lead (student_id null, matched by phone).
     */
    private function ownsSession(Session $session, $user): bool
    {
        if ($session->student_id !== null && (int) $session->student_id === (int) $user->id) {
            return true;
        }

        $last9 = $this->phoneLast9($user->phone);
        if ($last9 && $session->lead) {
            $leadDigits = preg_replace('/\D/', '', (string) $session->lead->phone);
            return strlen($leadDigits) >= 8 && substr($leadDigits, -9) === $last9;
        }

        return false;
    }
}
