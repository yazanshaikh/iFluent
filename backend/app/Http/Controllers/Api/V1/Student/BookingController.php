<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Lesson;
use App\Models\SessionRequest;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Student Session Booking
 *
 * Three booking modes:
 *   1. Core (random pool, no lesson)  → quick booking from app home screen
 *   2. Core (specific lesson)         → lesson_id provided, goes to teacher pool
 *   3. Private                        → teacher_code provided, directed to that teacher
 *
 * Guards:
 *   - Student must have lesson credits (lesson_credits > 0)
 *   - If lesson_id provided: student must be enrolled in the lesson's unit
 *   - No duplicate pending request for the same time window
 */
class BookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $student = $request->user();

        $validated = $request->validate([
            'lesson_id'    => ['sometimes', 'nullable', 'integer', 'exists:lessons,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'teacher_code' => ['sometimes', 'nullable', 'string'],
            'notes'        => ['sometimes', 'nullable', 'string', 'max:300'],
        ]);

        // Guard: student must have available lesson credits
        if ($student->lesson_credits < 1) {
            return response()->json([
                'message' => 'لا يوجد رصيد حصص متاح. يرجى التواصل مع الإدارة لتجديد اشتراكك.',
            ], 403);
        }

        // ── Lesson-specific booking ───────────────────────────────────────────
        $lesson = null;
        if (!empty($validated['lesson_id'])) {
            $lesson = Lesson::findOrFail($validated['lesson_id']);

            if (!$lesson->is_active) {
                return response()->json(['message' => 'This lesson is not available.'], 422);
            }

            if (!$lesson->is_assessment) {
                $enrolled = $student->enrolledUnits()
                    ->where('unit_id', $lesson->unit_id)
                    ->where('status', 'active')
                    ->exists();

                if (!$enrolled) {
                    return response()->json(['message' => 'You are not enrolled in this unit.'], 403);
                }
            }

            $alreadyPending = SessionRequest::where('student_id', $student->id)
                ->where('lesson_id', $lesson->id)
                ->where('status', SessionRequest::STATUS_PENDING)
                ->exists();

            if ($alreadyPending) {
                return response()->json(['message' => 'You already have a pending booking for this lesson.'], 422);
            }
        } else {
            // ── Auto-assign lesson from active subscription ───────────────────
            // IMPORTANT: Subscription.student_id = students.id (NOT users.id)
            $studentProfile = Student::where('user_id', $student->id)->first();

            $activeSubscription   = null;
            $exhaustedSubscription = false;

            if ($studentProfile) {
                $activeSubscription = Subscription::where('student_id', $studentProfile->id)
                    ->where('status', Subscription::STATUS_ACTIVE)
                    ->whereNotNull('current_lesson_id')
                    ->latest('activated_at')
                    ->first();

                // ── Check if subscription is exhausted ────────────────────────
                $exhaustedSubscription = Subscription::where('student_id', $studentProfile->id)
                    ->where('status', Subscription::STATUS_ACTIVE)
                    ->whereNotNull('to_lesson_id')
                    ->whereNull('current_lesson_id')
                    ->exists();
            }

            if ($exhaustedSubscription) {
                return response()->json([
                    'message' => 'لقد أكملت جميع دروس باقتك الحالية. يرجى التواصل مع الإدارة لتجديد الاشتراك.',
                ], 403);
            }

            if ($activeSubscription && $activeSubscription->hasRemainingLessons()) {
                $lesson = $activeSubscription->currentLesson;

                if ($lesson) {
                    // Prevent duplicate pending booking for same lesson
                    $alreadyPending = SessionRequest::where('student_id', $student->id)
                        ->where('lesson_id', $lesson->id)
                        ->where('status', SessionRequest::STATUS_PENDING)
                        ->exists();

                    if ($alreadyPending) {
                        return response()->json([
                            'message' => 'لديك حجز نشط بالفعل لهذا الدرس. يرجى انتظار تأكيد الموعد الحالي.',
                        ], 422);
                    }
                }
            } else {
                $lesson = null;

                // No subscription lesson range — fall back to plain quick booking
                $alreadyPending = SessionRequest::where('student_id', $student->id)
                    ->whereIn('type', [SessionRequest::TYPE_CORE, SessionRequest::TYPE_PRIVATE])
                    ->where('status', SessionRequest::STATUS_PENDING)
                    ->where('requested_at_utc', '>', now())
                    ->exists();

                if ($alreadyPending) {
                    return response()->json([
                        'message' => 'لديك حجز حصة نشط بالفعل. يرجى انتظار تأكيد الموعد الحالي.',
                    ], 422);
                }
            }
        }

        // ── Resolve teacher (private mode) ────────────────────────────────────
        $targetTeacherId = null;
        $type = SessionRequest::TYPE_CORE;

        if (!empty($validated['teacher_code'])) {
            $teacher = \App\Models\Teacher::where('teacher_code', $validated['teacher_code'])
                ->where('is_active', true)
                ->with('user')
                ->first();

            if (!$teacher) {
                return response()->json(['message' => 'Teacher not found with that code.'], 404);
            }

            $targetTeacherId = $teacher->user_id;
            $type = SessionRequest::TYPE_PRIVATE;
        }

        $sessionRequest = SessionRequest::create([
            'type'              => $type,
            'requested_by'      => $student->id,
            'student_id'        => $student->id,
            'lesson_id'         => $lesson?->id,
            'target_teacher_id' => $targetTeacherId,
            'requested_at_utc'  => $validated['scheduled_at'],
            'status'            => SessionRequest::STATUS_PENDING,
        ]);

        // ── Create / update Lead only for assessment session bookings ──────────
        // Regular core/private sessions do NOT create a Lead.
        // Assessment sessions (is_assessment = true) signal that the student
        // is being evaluated → appear in CRM New Leads with appointment date.
        if ($lesson && $lesson->is_assessment) {
            $studentProfile = Student::where('user_id', $student->id)->first();

            $lead = Lead::firstOrCreate(
                ['phone' => $student->phone],
                [
                    'name'   => $student->name,
                    'source' => 'app_assessment',
                    'status' => Lead::STATUS_NEW,
                ],
            );

            // Save appointment date on the lead
            $lead->update(['scheduled_at' => $validated['scheduled_at']]);

            // Link the session request and student profile to the lead
            $sessionRequest->update(['lead_id' => $lead->id]);

            if ($studentProfile && !$studentProfile->lead_id) {
                $studentProfile->update(['lead_id' => $lead->id]);
            }
        }

        return response()->json([
            'message' => $type === SessionRequest::TYPE_PRIVATE
                ? 'تم إرسال طلب الحصة الخاصة للمعلم.'
                : 'تم إرسال طلب الحصة. سيصلك تأكيد من المعلم قريباً.',
            'request' => [
                'id'           => $sessionRequest->id,
                'type'         => $sessionRequest->type,
                'status'       => $sessionRequest->status,
                'scheduled_at' => $sessionRequest->requested_at_utc->toIso8601String(),
                'lesson_id'    => $sessionRequest->lesson_id,
            ],
        ], 201);
    }

    // ─── List Student's Booking Requests ──────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $requests = SessionRequest::where('student_id', $student->id)
            ->with(['lesson:id,title', 'assignedTeacher:id,name'])
            ->when(
                $request->filled('status'),
                fn($q) => $q->where('status', $request->status)
            )
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($requests->through(fn($r) => [
            'id'             => $r->id,
            'type'           => $r->type,
            'status'         => $r->status,
            'scheduled_at'   => $r->requested_at_utc?->toIso8601String(),
            'lesson'         => $r->lesson ? ['id' => $r->lesson->id, 'title' => $r->lesson->title] : null,
            'teacher'        => $r->assignedTeacher ? ['name' => $r->assignedTeacher->name] : null,
            'session_id'     => $r->session_id,
        ]));
    }

    // ─── Booking Profile ─────────────────────────────────────────────────────

    /**
     * Profile view for a booking request — shown even before a session exists.
     * Returns lesson details (title, pdf), booking status, and teacher info.
     * If a session was created, includes session_id so the app can pivot to
     * the full session profile.
     */
    public function profile(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        $student = $request->user();

        if ($sessionRequest->student_id !== $student->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // ── Resolve lesson ────────────────────────────────────────────────────
        // Priority 1: lesson attached directly to the booking request
        // Priority 2: current_lesson_id from the student's active subscription
        //             (covers bookings made before lesson range was configured)
        $lesson = $sessionRequest->lesson()->with(['unit.level', 'level'])->first();

        if (!$lesson) {
            // Fallback: get lesson from student's active subscription.
            // IMPORTANT: Subscription.student_id = students.id (NOT users.id)
            $studentProfile     = Student::where('user_id', $student->id)->first();
            $activeSubscription = $studentProfile
                ? Subscription::where('student_id', $studentProfile->id)
                    ->where('status', Subscription::STATUS_ACTIVE)
                    ->latest('activated_at')
                    ->first()
                : null;

            if ($activeSubscription) {
                // Priority A: current_lesson_id (set after lesson range approval)
                if ($activeSubscription->current_lesson_id) {
                    $lesson = $activeSubscription->currentLesson()
                        ->with(['unit.level', 'level'])->first();
                }
                // Priority B: from_lesson_id (lesson range set but not started)
                elseif ($activeSubscription->from_lesson_id) {
                    $lesson = $activeSubscription->fromLesson()
                        ->with(['unit.level', 'level'])->first();
                }
            }
        }

        $lessonData = null;
        if ($lesson) {
            $lessonData = [
                'id'           => $lesson->id,
                'title'        => $lesson->title,
                'pdf_url'      => $lesson->pdf_url,
                'is_assessment' => (bool) $lesson->is_assessment,
            ];
            if (!$lesson->is_assessment && $lesson->unit) {
                $lessonData['unit']  = ['id' => $lesson->unit->id, 'name' => $lesson->unit->name];
                $lessonData['level'] = [
                    'id'   => $lesson->unit->level->id,
                    'code' => $lesson->unit->level->code,
                    'name' => $lesson->unit->level->name,
                ];
            }
        }

        return response()->json([
            'id'           => $sessionRequest->id,
            'status'       => $sessionRequest->status,
            'scheduled_at' => $sessionRequest->requested_at_utc?->toIso8601String(),
            'teacher'      => $sessionRequest->assignedTeacher
                                ? ['name' => $sessionRequest->assignedTeacher->name]
                                : null,
            'lesson'       => $lessonData,
            'session_id'   => $sessionRequest->session_id,
        ]);
    }

    // ─── Cancel a Booking Request ─────────────────────────────────────────────

    public function cancel(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        $student = $request->user();

        if ($sessionRequest->student_id !== $student->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$sessionRequest->isPending()) {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        $sessionRequest->update([
            'status'               => SessionRequest::STATUS_CANCELLED,
            'cancellation_reason'  => $request->input('reason'),
        ]);

        return response()->json(['message' => 'Booking request cancelled.']);
    }
}
