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
            // Hide completed/cancelled sessions older than 24 hours
            ->where(function ($q) {
                $q->whereNotIn('status', [Session::STATUS_COMPLETED, Session::STATUS_CANCELLED])
                  ->orWhere('ended_at', '>=', now()->subDay());
            })
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

        return new SessionResource($session->load(['lesson.level', 'lesson.unit.level', 'student']));
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

        // ── Auto-determine attendance status ──────────────────────────────────
        // attended  = student joined AND session lasted ≥ 10 minutes
        // absent    = student never joined OR session lasted < 10 minutes
        // (teacher_absent is set by the scheduler, not by the teacher manually)
        $endedAt = now();

        $attendance = $this->resolveAttendance($session, $endedAt);

        if ($session->daily_room_name) {
            $this->daily->deleteRoom($session->daily_room_name);
        }

        DB::transaction(function () use ($session, $endedAt, $attendance) {
            $session->update([
                'status'            => Session::STATUS_COMPLETED,
                'ended_at'          => $endedAt,
                'attendance_status' => $attendance,
            ]);

            // ── Conditional logic based on attendance ─────────────────────────
            //
            // attended      → advance lesson pointer + deduct credit
            // absent        → deduct credit only  (lesson stays for next time)
            // teacher_absent → do nothing          (no penalty for student)
            //
            if ($attendance === Session::ATTENDANCE_TEACHER_ABSENT) {
                // غاب المعلم — الحصة كأنها لم تكن، لا خصم ولا تقدم
                return;
            }

            // Both attended + absent: deduct one lesson credit
            if ($session->student_id) {
                $session->student->decrement('lesson_credits');
            }

            if ($attendance === Session::ATTENDANCE_ABSENT) {
                // غاب الطالب — خصم الرصيد لكن يبقى على نفس الدرس
                return;
            }

            // ── attended: advance subscription lesson pointer ─────────────────
            // IMPORTANT: Subscription.student_id = students.id (NOT users.id)
            if ($session->lesson_id) {
                $studentProfile = \App\Models\Student::where('user_id', $session->student_id)->first();
                $subscription   = $studentProfile
                    ? \App\Models\Subscription::where('student_id', $studentProfile->id)
                        ->where('status', \App\Models\Subscription::STATUS_ACTIVE)
                        ->where('current_lesson_id', $session->lesson_id)
                        ->latest('activated_at')
                        ->first()
                    : null;

                if ($subscription) {
                    $subscription->advanceToNextLesson();
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

            // Balance is now calculated dynamically: sessions_count × commission_rate
            // No need to store it — skip balance increment
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

    // ─── Release Session (إلغاء السحب) ───────────────────────────────────────
    // Cancels the session and returns the original request back to the pool.
    // Blocked if less than 30 minutes remain before the scheduled time.

    public function release(Session $session, Request $request): JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->isWaiting()) {
            return response()->json([
                'message' => 'لا يمكن إلغاء السحب — الحصة ليست في حالة انتظار.',
            ], 422);
        }

        // Block if less than 30 minutes remain before scheduled time
        if ($session->scheduled_at && $session->scheduled_at->diffInMinutes(now(), false) > -30) {
            return response()->json([
                'message' => 'لا يمكن إلغاء السحب خلال نصف ساعة من موعد الحصة أو بعده.',
            ], 422);
        }

        \DB::transaction(function () use ($session) {
            // Cancel the session with a specific reason so it can be filtered out
            $session->update([
                'status'   => Session::STATUS_CANCELLED,
                'ended_at' => now(),
            ]);

            // Return the original session request back to the pool
            \App\Models\SessionRequest::where('session_id', $session->id)
                ->update([
                    'status'              => \App\Models\SessionRequest::STATUS_PENDING,
                    'assigned_teacher_id' => null,
                    'confirmed_at'        => null,
                    'session_id'          => null,
                ]);
        });

        return response()->json(['message' => 'تم إلغاء السحب وإعادة الطلب للمجموعة.']);
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

    // ─── Private Helpers ──────────────────────────────────────────────────────

    /**
     * Auto-determine attendance status when teacher ends a session.
     * attended = student joined AND was present for ≥ 10 minutes
     * absent   = student never joined OR session was too short
     */
    private function resolveAttendance(Session $session, \Carbon\Carbon $endedAt): string
    {
        if (!$session->student_joined_at) {
            return Session::ATTENDANCE_ABSENT;
        }

        $minutes = $session->student_joined_at->diffInMinutes($endedAt);

        return $minutes >= Session::MIN_SESSION_MINUTES
            ? Session::ATTENDANCE_ATTENDED
            : Session::ATTENDANCE_ABSENT;
    }
}
