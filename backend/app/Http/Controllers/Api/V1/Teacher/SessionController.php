<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LessonResource;
use App\Http\Resources\Api\V1\SessionResource;
use App\Models\Lesson;
use App\Models\Session;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Models\TeacherEarning;
use App\Models\User;
use App\Services\DailyCoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function __construct(private readonly DailyCoService $daily) {}

    // ─── List Sessions ────────────────────────────────────────────────────────

    public function index(Request $request): AnonymousResourceCollection
    {
        $sessions = Session::forTeacher($request->user()->id)
            ->with(['lesson.unit.level', 'student'])
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->orderByDesc('scheduled_at')
            ->paginate(20);

        return SessionResource::collection($sessions);
    }

    // ─── Create Session ───────────────────────────────────────────────────────

    /**
     * Schedule a session for a student.
     *
     * Regular lesson   (is_assessment = false):
     *   → Student MUST have an active subscription and be enrolled in the lesson's unit.
     *
     * Assessment lesson (is_assessment = true):
     *   → Student must NOT have any active subscription.
     *     (Used to evaluate prospects before they buy.)
     */
    public function store(Request $request): SessionResource|JsonResponse
    {
        $request->validate([
            'lesson_id'    => ['required', 'integer', 'exists:lessons,id'],
            'student_id'   => ['required', 'integer', 'exists:users,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        $student = User::findOrFail($request->student_id);
        if (!$student->isStudent()) {
            return response()->json(['message' => 'The selected user is not a student.'], 422);
        }

        $lesson = Lesson::with('unit')->findOrFail($request->lesson_id);
        if (!$lesson->is_active) {
            return response()->json(['message' => 'This lesson is not currently active.'], 422);
        }

        // ── Assessment lesson guard ───────────────────────────────────────────
        if ($lesson->is_assessment) {
            // Assessment sessions are ONLY for non-subscribed students (prospects)
            $hasActiveSubscription = \App\Models\Subscription::where('student_id', $student->student?->id)
                ->where('status', 'active')
                ->exists();

            if ($hasActiveSubscription) {
                return response()->json([
                    'message' => 'Assessment sessions are only for non-subscribed students. This student already has an active subscription.',
                ], 422);
            }

            $session = Session::create([
                'lesson_id'    => $lesson->id,
                'teacher_id'   => $request->user()->id,
                'student_id'   => $student->id,
                'status'       => Session::STATUS_WAITING,
                'scheduled_at' => $request->scheduled_at,
            ]);

            return new SessionResource($session->load(['lesson.level', 'student']));
        }

        // ── Regular lesson guard ──────────────────────────────────────────────
        $enrolled = $student->enrolledUnits()
            ->where('unit_id', $lesson->unit_id)
            ->where('status', 'active')
            ->exists();

        if (!$enrolled) {
            return response()->json([
                'message' => 'Student is not enrolled in the unit containing this lesson.',
            ], 403);
        }

        $session = Session::create([
            'lesson_id'    => $lesson->id,
            'teacher_id'   => $request->user()->id,
            'student_id'   => $student->id,
            'status'       => Session::STATUS_WAITING,
            'scheduled_at' => $request->scheduled_at,
        ]);

        return new SessionResource($session->load(['lesson.unit.level', 'student']));
    }

    // ─── Show Session ─────────────────────────────────────────────────────────

    public function show(Session $session, Request $request): SessionResource|JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return new SessionResource($session->load(['lesson.unit.level', 'student']));
    }

    // ─── Start Session ────────────────────────────────────────────────────────

    public function start(Session $session, Request $request): SessionResource|JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->canBeStarted()) {
            return response()->json([
                'message' => "Session cannot be started. Current status: {$session->status}.",
            ], 422);
        }

        $room = $this->daily->createRoom($session);

        $session->update([
            'status'            => Session::STATUS_ACTIVE,
            'daily_room_name'   => $room['room_name'],
            'daily_room_url'    => $room['room_url'],
            'started_at'        => now(),
            'teacher_joined_at' => now(),
        ]);

        return new SessionResource($session->load(['lesson.unit.level', 'student']));
    }

    // ─── Update Nearpod PIN ───────────────────────────────────────────────────

    public function updatePin(Session $session, Request $request): SessionResource|JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->isActive()) {
            return response()->json(['message' => 'PIN can only be set on an active session.'], 422);
        }

        $request->validate(['nearpod_pin' => ['required', 'string', 'max:20']]);

        $session->update(['nearpod_pin' => $request->nearpod_pin]);

        return new SessionResource($session->load(['lesson', 'student']));
    }

    // ─── End Session ──────────────────────────────────────────────────────────

    public function end(Session $session, Request $request): SessionResource|JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->canBeEnded()) {
            return response()->json([
                'message' => "Session cannot be ended. Current status: {$session->status}.",
            ], 422);
        }

        if ($session->daily_room_name) {
            $this->daily->deleteRoom($session->daily_room_name);
        }

        $endedAt = now();

        DB::transaction(function () use ($session, $endedAt) {
            $session->update([
                'status'   => Session::STATUS_COMPLETED,
                'ended_at' => $endedAt,
            ]);

            // ── Advance subscription current_lesson_id ────────────────────────
            // After a session completes, move the student's lesson pointer
            // forward so the next booking auto-assigns the next lesson.
            if ($session->lesson_id) {
                $subscription = \App\Models\Subscription::where('student_id', $session->student_id)
                    ->where('status', \App\Models\Subscription::STATUS_ACTIVE)
                    ->where('current_lesson_id', $session->lesson_id)
                    ->latest('activated_at')
                    ->first();

                if ($subscription) {
                    $subscription->advanceToNextLesson();

                    // Decrement student's lesson_credits
                    $session->student->decrement('lesson_credits');
                }
            }

            // ── Auto-credit teacher commission (10-minute rule) ───────────────
            // Commission is only credited if BOTH teacher and student were present
            // AND the student was in the session for at least 10 minutes.
            $session->refresh(); // reload with ended_at

            if (!$session->isEligibleForCommission()) {
                // Session too short or student never joined — no commission
                return;
            }

            $teacherProfile = Teacher::where('user_id', $session->teacher_id)->first();

            if ($teacherProfile && $teacherProfile->commission_rate > 0) {
                $amount = $teacherProfile->commission_rate;

                // Determine session type
                $sessionType = 'core';
                $linkedRequest = \App\Models\SessionRequest::where('session_id', $session->id)->first();
                if ($linkedRequest) {
                    $sessionType = $linkedRequest->type;
                }

                TeacherEarning::create([
                    'teacher_id'   => $session->teacher_id,
                    'session_id'   => $session->id,
                    'amount'       => $amount,
                    'session_type' => $sessionType,
                    'credited_at'  => $endedAt,
                ]);

                $teacherProfile->increment('balance', $amount);
            }
        });

        return new SessionResource($session->load(['lesson', 'student']));
    }

    // ─── Cancel Session ───────────────────────────────────────────────────────

    public function cancel(Session $session, Request $request): JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->isWaiting()) {
            return response()->json(['message' => 'Only waiting sessions can be cancelled.'], 422);
        }

        $session->update([
            'status'   => Session::STATUS_CANCELLED,
            'ended_at' => now(),
        ]);

        return response()->json(['message' => 'Session cancelled successfully.']);
    }

    // ─── List Lessons (regular) ───────────────────────────────────────────────

    public function lessons(Request $request): AnonymousResourceCollection
    {
        $lessons = Lesson::with(['unit', 'level'])
            ->active()
            ->regular()   // is_assessment = false
            ->when($request->filled('level_id'), fn($q) => $q->where('level_id', $request->level_id))
            ->when($request->filled('unit_id'),  fn($q) => $q->where('unit_id', $request->unit_id))
            ->paginate(20);

        return LessonResource::collection($lessons);
    }

    // ─── List Assessment Lessons ──────────────────────────────────────────────

    /**
     * The 5 assessment lessons — one per level.
     * Teacher picks one when scheduling an evaluation session for a prospect.
     */
    public function assessmentLessons(Request $request): AnonymousResourceCollection
    {
        $lessons = Lesson::with('level')
            ->active()
            ->assessment()  // is_assessment = true
            ->when($request->filled('level_id'), fn($q) => $q->where('level_id', $request->level_id))
            ->get();

        return LessonResource::collection($lessons);
    }
}
