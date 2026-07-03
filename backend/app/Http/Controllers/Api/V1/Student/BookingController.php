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
            'scheduled_at'        => ['required', 'date', 'after:now'],
            'teacher_code'        => ['sometimes', 'nullable', 'string'],
            'teacher_gender_pref' => ['sometimes', 'nullable', 'string', 'in:male,female'],
            'notes'               => ['sometimes', 'nullable', 'string', 'max:300'],
        ]);

        // ── Parse as Jordan time → convert to UTC for storage ────────────────
        // The student app sends "YYYY-MM-DD HH:MM:00" in Jordan local time (UTC+3).
        // We must interpret it as Jordan time then store as UTC so that
        // CRM displays (which adds +3) shows the correct time.
        $scheduledUtc = \Carbon\Carbon::parse($validated['scheduled_at'], 'Asia/Amman')
            ->utc();

        // ── Jordan working hours check: 09:00–00:00 ──────────────────────────
        $jordanHour = (int) $scheduledUtc->copy()->setTimezone('Asia/Amman')->format('H');

        if ($jordanHour < 9 || $jordanHour >= 24) {
            return response()->json([
                'message' => 'يُقبل الحجز فقط بين الساعة ٩ صباحاً و١٢ منتصف الليل بتوقيت الأردن.',
            ], 422);
        }

        // Overwrite validated value with the UTC version for consistent storage
        $validated['scheduled_at'] = $scheduledUtc->toDateTimeString();

        // ── GLOBAL GUARD: only ONE active booking at a time ───────────────────
        // Block if the student already has:
        //   • a pending/confirmed request whose time hasn't passed yet, OR
        //   • a waiting/active session
        // This is the single source of truth for "you already have a booking".
        $hasActiveRequest = SessionRequest::where('student_id', $student->id)
            ->whereIn('status', [SessionRequest::STATUS_PENDING, SessionRequest::STATUS_CONFIRMED])
            ->where('requested_at_utc', '>', now())
            ->exists();

        $hasLiveSession = \App\Models\Session::where('student_id', $student->id)
            ->whereIn('status', ['waiting', 'active'])
            ->exists();

        if ($hasActiveRequest || $hasLiveSession) {
            return response()->json([
                'message' => 'لا يمكنك حجز حصة جديدة — لديك حصة محجوزة بالفعل. يرجى إكمالها أو إلغاؤها أولاً.',
            ], 422);
        }

        // ── Lesson-specific booking ───────────────────────────────────────────
        // If lesson_id = 'assessment' or not provided and student has no credits,
        // randomly pick one of the active assessment lessons.
        $lesson = null;
        $isAssessmentRequest = ($validated['lesson_id'] ?? null) === 'assessment'
            || (empty($validated['lesson_id']) && $student->lesson_credits < 1);

        if ($isAssessmentRequest) {
            // Random assessment lesson from the pool (with pdf preferred)
            $lesson = Lesson::where('is_assessment', true)
                ->where('is_active', true)
                ->whereNotNull('pdf_url')
                ->inRandomOrder()
                ->first()
                ?? Lesson::where('is_assessment', true)->where('is_active', true)->inRandomOrder()->first();

            if (!$lesson) {
                return response()->json(['message' => 'لا تتوفر حصص تقييمية حالياً.'], 422);
            }
            // Force validated lesson_id
            $validated['lesson_id'] = $lesson->id;
        } elseif (!empty($validated['lesson_id'])) {
            $lesson = Lesson::findOrFail($validated['lesson_id']);

            if (!$lesson->is_active) {
                return response()->json(['message' => 'This lesson is not available.'], 422);
            }

            // Credits guard: skip for assessment lessons (free evaluation for non-subscribers)
            if (!$lesson->is_assessment && $student->lesson_credits < 1) {
                return response()->json([
                    'message' => 'لا يوجد رصيد حصص متاح. يرجى التواصل مع الإدارة لتجديد اشتراكك.',
                ], 403);
            }

            if (!$lesson->is_assessment) {
                $enrolled = $student->enrolledUnits()
                    ->where('unit_id', $lesson->unit_id)
                    ->where('status', 'active')
                    ->exists();

                if (!$enrolled) {
                    return response()->json(['message' => 'You are not enrolled in this unit.'], 403);
                }

                // Defense-in-depth: lesson must be inside the student's PAID range.
                // Prevents booking an unpaid lesson from a partially-covered unit.
                $paidLessonIds = Subscription::paidLessonIdsForUser($student->id);
                if (!$paidLessonIds->contains($lesson->id)) {
                    return response()->json([
                        'message' => 'هذا الدرس خارج نطاق اشتراكك الحالي.',
                    ], 403);
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
            // Quick booking (no lesson_id) always requires credits
            if ($student->lesson_credits < 1) {
                return response()->json([
                    'message' => 'لا يوجد رصيد حصص متاح. يرجى التواصل مع الإدارة لتجديد اشتراكك.',
                ], 403);
            }

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

        // Assessment lessons use TYPE_DEMO so they appear in CRM Trial Bookings
        $type = ($lesson && $lesson->is_assessment)
            ? SessionRequest::TYPE_DEMO
            : SessionRequest::TYPE_CORE;

        if (!empty($validated['teacher_code'])) {
            $teacher = \App\Models\Teacher::where('teacher_code', $validated['teacher_code'])
                ->where('is_active', true)
                ->with('user')
                ->first();

            if (!$teacher) {
                return response()->json(['message' => 'Teacher not found with that code.'], 404);
            }

            $targetTeacherId = $teacher->user_id;
            if (!$lesson?->is_assessment) {
                $type = SessionRequest::TYPE_PRIVATE;
            }
        }

        // ── Atomic booking: create request + deduct credit + link lead ────────
        // Money-sensitive, so it all commits together or not at all. The student
        // row is locked (lockForUpdate) and the balance re-checked INSIDE the
        // transaction to stop two concurrent requests from spending the same
        // credit (double-spend). If insufficient, abort with 403 (rolls back).
        $sessionRequest = DB::transaction(function () use (
            $student, $lesson, $type, $targetTeacherId, $validated
        ) {
            $isPaid = ! $lesson?->is_assessment;

            if ($isPaid) {
                // Lock the balance row; re-verify after acquiring the lock.
                $locked = User::whereKey($student->id)->lockForUpdate()->first();
                if (! $locked || $locked->lesson_credits < 1) {
                    throw new \Illuminate\Http\Exceptions\HttpResponseException(
                        response()->json([
                            'message' => 'لا يوجد رصيد حصص متاح. يرجى التواصل مع الإدارة لتجديد اشتراكك.',
                        ], 403)
                    );
                }
            }

            $sessionRequest = SessionRequest::create([
                'type'                => $type,
                'requested_by'        => $student->id,
                'student_id'          => $student->id,
                'lesson_id'           => $lesson?->id,
                'target_teacher_id'   => $targetTeacherId,
                'requested_at_utc'    => $validated['scheduled_at'],
                'status'              => SessionRequest::STATUS_PENDING,
                'teacher_gender_pref' => $validated['teacher_gender_pref'] ?? null,
                'note'                => $validated['notes'] ?? null,
            ]);

            // Deduct 1 credit on booking (non-assessment only). Assessment
            // sessions are free; credit is refunded later if teacher_absent.
            if ($isPaid) {
                $student->decrement('lesson_credits');
            }

            // Create / update Lead only for assessment bookings (CRM New Leads).
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

                $lead->update(['scheduled_at' => $validated['scheduled_at']]);
                $sessionRequest->update(['lead_id' => $lead->id]);

                if ($studentProfile && !$studentProfile->lead_id) {
                    $studentProfile->update(['lead_id' => $lead->id]);
                }
            }

            return $sessionRequest;
        });

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

        // A student's bookings = their own requests + any demo/trial booked for
        // their lead (from the landing page or the CRM). Those carry lead_id but
        // student_id = null, so filtering on student_id alone hides them. The lead
        // phone is stored raw while the user's is E.164 — match on the last 9
        // digits so format differences (+962 / 0…) don't break the link.
        $phoneDigits = preg_replace('/\D/', '', (string) $student->phone);
        $last9       = strlen($phoneDigits) >= 8 ? substr($phoneDigits, -9) : null;

        $requests = SessionRequest::where(function ($base) use ($student, $last9) {
                $base->where('student_id', $student->id);
                if ($last9) {
                    $base->orWhereHas('lead', function ($lq) use ($last9) {
                        $lq->whereRaw("RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 9) = ?", [$last9]);
                    });
                }
            })
            ->with(['lesson:id,title', 'assignedTeacher:id,name'])
            ->when(
                $request->filled('status'),
                fn($q) => $q->where('status', $request->status)
            )
            // ── Visibility rules ──────────────────────────────────────────────
            // Never show pending/confirmed requests whose time has passed (+15min)
            // Scheduler will mark them expired eventually, but hide immediately
            ->where(function ($q) {
                $q->whereNotIn('status', [
                    SessionRequest::STATUS_PENDING,
                    SessionRequest::STATUS_CONFIRMED,
                ])
                ->orWhere('requested_at_utc', '>=', now()->subMinutes(15));
            })
            // Hide rejected/cancelled/expired older than 24h (clutter)
            ->where(function ($q) {
                $q->whereNotIn('status', [
                    SessionRequest::STATUS_REJECTED,
                    SessionRequest::STATUS_CANCELLED,
                    SessionRequest::STATUS_EXPIRED,
                ])
                ->orWhere('updated_at', '>=', now()->subDay());
            })
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

        if (! $this->ownsRequest($sessionRequest, $student)) {
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

        if (! $this->ownsRequest($sessionRequest, $student)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$sessionRequest->isPending()) {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        // Atomic cancel + refund. The conditional UPDATE only succeeds for the
        // first caller (status still pending); a concurrent double-cancel updates
        // 0 rows and skips the refund — so the credit is returned exactly once.
        $cancelled = DB::transaction(function () use ($sessionRequest, $student, $request) {
            $affected = SessionRequest::whereKey($sessionRequest->id)
                ->where('status', SessionRequest::STATUS_PENDING)
                ->update([
                    'status'              => SessionRequest::STATUS_CANCELLED,
                    'cancellation_reason' => $request->input('reason'),
                ]);

            if ($affected === 0) {
                return false; // already cancelled by another request
            }

            // Refund credit — student cancelled their own booking.
            if (! $sessionRequest->lesson?->is_assessment) {
                $student->increment('lesson_credits');
            }

            return true;
        });

        if (! $cancelled) {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        return response()->json(['message' => 'Booking request cancelled.']);
    }

    // ─── Ownership helpers ────────────────────────────────────────────────────

    /** Last 9 digits of a phone (format-agnostic), or null if too short. */
    private function phoneLast9(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);
        return strlen($digits) >= 8 ? substr($digits, -9) : null;
    }

    /**
     * A booking belongs to the current user if they are its student, or it's a
     * trial/assessment booked for their lead (student_id null, matched by phone).
     */
    private function ownsRequest(SessionRequest $req, $user): bool
    {
        if ($req->student_id !== null && (int) $req->student_id === (int) $user->id) {
            return true;
        }
        $last9 = $this->phoneLast9($user->phone);
        if ($last9 && $req->lead) {
            $leadDigits = preg_replace('/\D/', '', (string) $req->lead->phone);
            return strlen($leadDigits) >= 8 && substr($leadDigits, -9) === $last9;
        }
        return false;
    }
}
