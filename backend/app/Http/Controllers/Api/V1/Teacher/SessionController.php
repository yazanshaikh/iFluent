<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LessonResource;
use App\Http\Resources\Api\V1\SessionResource;
use App\Models\LeadRemark;
use App\Models\Lesson;
use App\Models\Session;
use App\Models\SessionRequest;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\Teacher;
use App\Models\TeacherEarning;
use App\Models\User;
use App\Services\DailyCoService;
use App\Services\SessionAttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
     * → Student MUST have an active subscription and be enrolled in the lesson's unit.
     *
     * Assessment lesson (is_assessment = true):
     * → Student must NOT have any active subscription.
     * (Used to evaluate prospects before they buy.)
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

    // ─── Classroom URL (fresh teacher token) ─────────────────────────────────
    // Called when teacher returns to an already-active session from the sessions list.
    // Returns a fresh signed Daily.co URL with is_owner=true token.

    public function classroomUrl(Session $session, Request $request): JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->isActive()) {
            return response()->json(['message' => 'Session is not active.'], 422);
        }

        // Re-create the room if Daily already expired/removed it (it was created
        // back when the teacher accepted, possibly hours before the lesson).
        $signedUrl = $this->daily->ensureRoom($session) ?? $session->daily_room_url;
        $session->refresh();

        if ($session->daily_room_name) {
            try {
                $token     = $this->daily->createMeetingToken($session->daily_room_name, true);
                $signedUrl = $session->daily_room_url . '?t=' . $token;
            } catch (\Throwable $e) {
                Log::warning('classroomUrl: token creation failed', ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'session_id'     => $session->id,
            'daily_room_url' => $signedUrl,
            'nearpod_pin'    => $session->nearpod_pin,
        ]);
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

        // TIMING VALIDATION: Teacher can only start within 15 minutes BEFORE scheduled time
        $now = now();
        $scheduledTime = Carbon::parse($session->scheduled_at);
        $fifteenMinutesBefore = $scheduledTime->copy()->subMinutes(15);
        $gracePeriod = $scheduledTime->copy()->addMinutes(15);

        // Too early: before 15 min window
        if ($now->isBefore($fifteenMinutesBefore)) {
            $minutesUntilWindow = $fifteenMinutesBefore->diffInMinutes($now);
            return response()->json([
                'message' => 'لا يمكن تفعيل الحصة الآن',
                'reason' => 'too_early',
                'details' => "ممكن تفعيل الحصة قبل موعدها بـ 15 دقيقة فقط",
                'scheduled_at' => $session->scheduled_at,
                'can_start_at' => $fifteenMinutesBefore->toIso8601String(),
                'minutes_until_allowed' => $minutesUntilWindow,
            ], 422);
        }

        // Too late: after grace period
        if ($now->isAfter($gracePeriod)) {
            $minutesLate = $now->diffInMinutes($gracePeriod);
            return response()->json([
                'message' => 'انتهى وقت تفعيل الحصة',
                'reason' => 'too_late',
                'details' => "يمكن تفعيل الحصة حتى 15 دقيقة بعد الموعد فقط",
                'scheduled_at' => $session->scheduled_at,
                'deadline_was' => $gracePeriod->toIso8601String(),
                'minutes_late' => $minutesLate,
            ], 422);
        }

        // PIN is required to start — teacher must enter and confirm it first
        $validated = $request->validate([
            'nearpod_pin' => ['required', 'string', 'max:50'],
        ]);

        $pin = trim($validated['nearpod_pin']);

        // Block if teacher already has another active session
        $alreadyActive = Session::where('teacher_id', $request->user()->id)
            ->where('status', Session::STATUS_ACTIVE)
            ->where('id', '!=', $session->id)
            ->exists();

        if ($alreadyActive) {
            return response()->json([
                'message' => 'لديك حصة نشطة حالياً. يرجى إنهاؤها قبل بدء حصة جديدة.',
            ], 422);
        }

        // Make sure a JOINABLE room exists — it may never have been created, or
        // Daily may have expired it since the teacher accepted the request. Done
        // before the transaction so the HTTP calls don't hold it open.
        $this->daily->ensureRoom($session);
        $session->refresh();

        // Atomic: save PIN + mark active
        DB::transaction(function () use ($session, $pin) {
            $session->update([
                'status'            => Session::STATUS_ACTIVE,
                'nearpod_pin'       => $pin,
                'started_at'        => now(),
                'teacher_joined_at' => now(),
            ]);

            // Mark teacher as PRESENT (they clicked start)
            SessionAttendanceService::markTeacherPresent($session);
        });

        $session->loadMissing(['lesson', 'student']);

        // Ensure the room is public so the student (non-owner) can join reliably
        // (handles rooms created as private before this change).
        if ($session->daily_room_name) {
            $this->daily->ensureRoomPublic($session->daily_room_name);
        }

        // Generate teacher meeting token (is_owner = true)
        $teacherToken = null;
        if ($session->daily_room_name) {
            try {
                $teacherToken = $this->daily->createMeetingToken($session->daily_room_name, true);
            } catch (\Throwable $e) {
                Log::warning('Could not create teacher token', ['error' => $e->getMessage()]);
            }
        }

        // Broadcast to student in real-time — "انضم للحصة" button appears immediately
        try {
            broadcast(new \App\Events\SessionActivated($session));
        } catch (\Throwable) {}

        $resource = (new SessionResource($session->load(['lesson.unit.level', 'student'])))->toArray(request());
        $resource['daily_token']    = $teacherToken;
        $resource['daily_room_url'] = $session->daily_room_url
            . ($teacherToken ? '?t=' . $teacherToken : '');

        return response()->json(['data' => $resource]);
    }

    // ─── Update Nearpod PIN ───────────────────────────────────────────────────

    public function updatePin(Session $session, Request $request): SessionResource|JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate(['nearpod_pin' => ['required', 'string', 'max:50']]);

        $session->update(['nearpod_pin' => trim($request->nearpod_pin)]);

        // If session is already active, re-broadcast so student gets the updated PIN
        if ($session->isActive()) {
            $session->loadMissing('lesson');
            broadcast(new \App\Events\SessionActivated($session));
        }

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

        // ── Auto-determine attendance status using new service ────────────────
        // attended      = teacher_present && student_present
        // absent        = teacher_present && !student_present
        // teacher_absent = !teacher_present (set by scheduler or auto-expire)
        $endedAt = now();

        // Auto-determine attendance from presence flags (no manual input needed)
        $attendance = SessionAttendanceService::determineAttendanceStatus($session);

        if ($session->daily_room_name) {
            $this->daily->deleteRoom($session->daily_room_name);
        }

        DB::transaction(function () use ($session, $endedAt, $attendance) {
            $session->update([
                'status'            => Session::STATUS_COMPLETED,
                'ended_at'          => $endedAt,
                'teacher_ended_at'  => $endedAt,
                'attendance_status' => $attendance,
            ]);

            // Update SessionRequest updated_at timestamp so it stays visible in CRM for 24h
            // The CRM now uses Session.status (completed) instead of SessionRequest.status
            $sessionRequest = \App\Models\SessionRequest::where('session_id', $session->id)->first();
            if ($sessionRequest) {
                $sessionRequest->update([
                    'updated_at' => $endedAt,  // ← Update timestamp for 24h visibility window
                ]);
                \Log::info("SessionRequest timestamp updated after session completion", [
                    'session_request_id' => $sessionRequest->id,
                    'session_id' => $session->id,
                    'session_status' => $session->status,
                ]);
            }

            // ── Credit & lesson advancement rules ─────────────────────────────
            //
            // النقطة تُخصم عند الحجز مسبقاً.
            // عند إنهاء الحصة:
            //
            // attended      → النقطة تبقى مخصومة  + تقدم للدرس التالي
            //
            // absent        → النقطة تبقى مخصومة  (الطالب مسؤول)
            // لا تقدم (يبقى على نفس الدرس)
            //
            // teacher_absent → ترجع النقطة للطالب  + لا تقدم
            //
            if ($attendance === Session::ATTENDANCE_TEACHER_ABSENT) {
                // المعلم غاب — أرجع النقطة للطالب (مرة واحدة فقط، آمن ضد التسابق)
                if ($session->refundCreditOnce()) {
                    \Log::info("Credit refunded (teacher_absent)", ['student_id' => $session->student_id]);
                }
                return;
            }

            if ($attendance === Session::ATTENDANCE_ABSENT) {
                // الطالب غاب — النقطة مخصومة من الحجز، لا تقدم
                return;
            }

            // attended — النقطة مخصومة من الحجز، تقدم للدرس التالي
            // ── Mark the lesson as completed (powers progress bars app-wide) ──
            if ($session->lesson_id) {
                \App\Models\StudentProgress::updateOrCreate(
                    ['student_id' => $session->student_id, 'lesson_id' => $session->lesson_id],
                    ['lesson_completed' => true, 'completed_at' => now()],
                );
            }

            // ── Advance lesson pointer (attended only) ────────────────────────
            if ($session->lesson_id) {
                $studentProfile = \App\Models\Student::where('user_id', $session->student_id)->first();

                if ($studentProfile) {
                    $subscription = \App\Models\Subscription::where('student_id', $studentProfile->id)
                        ->where('status', \App\Models\Subscription::STATUS_ACTIVE)
                        ->where('from_lesson_id', '<=', $session->lesson_id)
                        ->where('to_lesson_id', '>=', $session->lesson_id)
                        ->whereNotNull('current_lesson_id')
                        ->latest('activated_at')
                        ->first();

                    if ($subscription && $subscription->current_lesson_id == $session->lesson_id) {
                        $nextLesson = $subscription->advanceToNextLesson();
                        \Log::info("Lesson advanced (attended)", [
                            'student_id'  => $session->student_id,
                            'from_lesson' => $session->lesson_id,
                            'to_lesson'   => $nextLesson?->id ?? 'completed',
                        ]);
                    }
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

        // Broadcast session end to student in real-time (best-effort — must never
        // fail the end request if Reverb is unreachable).
        try {
            broadcast(new \App\Events\SessionEnded($session, $attendance));
        } catch (\Throwable $e) {
            Log::warning('SessionEnded broadcast failed', ['error' => $e->getMessage()]);
        }

        return new SessionResource($session->load(['lesson', 'student']));
    }

    // ─── Submit Demo Evaluation ───────────────────────────────────────────────

    /**
     * After an assessment (demo) session ends, the teacher submits an evaluation
     * form. The content is saved as an immutable remark on the linked lead in CRM.
     */
    public function submitEvaluation(Session $session, Request $request): JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$session->isCompleted()) {
            return response()->json(['message' => 'يجب إنهاء الحصة أولاً قبل إرسال التقييم.'], 422);
        }

        $session->loadMissing('lesson');
        if (!$session->lesson?->is_assessment) {
            return response()->json(['message' => 'التقييم متاح للحصص التقييمية فقط.'], 422);
        }

        if ($session->evaluation_submitted_at) {
            return response()->json(['message' => 'تم إرسال التقييم مسبقاً.'], 422);
        }

        $validated = $request->validate([
            'evaluation_questions' => ['required', 'string', 'max:2000'],
            'student_level'        => ['required', 'string', 'in:A1,A2,B1,B2'],
            'strengths'            => ['required', 'string', 'max:1000'],
            'weaknesses'           => ['required', 'string', 'max:1000'],
            'general_notes'        => ['required', 'string', 'max:1000'],
        ]);

        $leadId = SessionRequest::where('session_id', $session->id)->value('lead_id');

        if (!$leadId && $session->student_id) {
            $leadId = Student::where('user_id', $session->student_id)->value('lead_id');
        }

        if (!$leadId) {
            return response()->json(['message' => 'لم يتم العثور على ملف الطالب في النظام.'], 422);
        }

        $content = implode("\n", [
            '📋 تقرير الحصة التقييمية',
            '━━━━━━━━━━━━━━━━━━━━',
            "مستوى الطالب: {$validated['student_level']}",
            '',
            'أسئلة التقييم بعد الحصة:',
            $validated['evaluation_questions'],
            '',
            'سرعة الفهم / نقاط القوة:',
            $validated['strengths'],
            '',
            'نقاط الضعف:',
            $validated['weaknesses'],
            '',
            'ملاحظات عامة:',
            $validated['general_notes'],
        ]);

        DB::transaction(function () use ($session, $leadId, $request, $content) {
            LeadRemark::create([
                'lead_id'  => $leadId,
                'staff_id' => $request->user()->id,
                'content'  => $content,
            ]);

            $session->update(['evaluation_submitted_at' => now()]);
        });

        return response()->json([
            'message' => 'تم حفظ التقييم في ملاحظات الطالب بنجاح.',
        ]);
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

    // ─── Raised Hands ─────────────────────────────────────────────────────────

    /**
     * GET /teacher/sessions/{session}/raised-hands
     * Returns the latest raise-hand event for this session (from cache).
     * Teacher app polls this every 5s to show notification.
     */
    public function raisedHands(Session $session, Request $request): \Illuminate\Http\JsonResponse
    {
        if ($session->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $key  = "raised_hand:session:{$session->id}";
        $data = \Illuminate\Support\Facades\Cache::get($key);

        return response()->json([
            'raised' => $data !== null,
            'data'   => $data,
        ]);
    }
}
