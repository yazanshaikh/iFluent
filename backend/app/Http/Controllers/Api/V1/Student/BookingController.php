<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\SessionRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Student Session Booking
 *
 * Two booking modes:
 *   1. Core (random pool) → no teacher specified → goes to all teachers
 *   2. Private            → teacher_code provided → directed to that teacher
 *
 * Guards:
 *   - Student must be enrolled in the lesson's unit
 *   - Student must have passed the previous lesson's quiz (lesson gating)
 *   - No duplicate pending request for same lesson
 */
class BookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $student = $request->user();

        $validated = $request->validate([
            'lesson_id'      => ['required', 'integer', 'exists:lessons,id'],
            'scheduled_at'   => ['required', 'date', 'after:now'],
            'teacher_code'   => ['sometimes', 'nullable', 'string'], // for private sessions
        ]);

        $lesson = Lesson::findOrFail($validated['lesson_id']);

        if (!$lesson->is_active) {
            return response()->json(['message' => 'This lesson is not available.'], 422);
        }

        // Gate: enrollment check (assessment lessons bypass enrollment check)
        if (!$lesson->is_assessment) {
            $enrolled = $student->enrolledUnits()
                ->where('unit_id', $lesson->unit_id)
                ->where('status', 'active')
                ->exists();

            if (!$enrolled) {
                return response()->json(['message' => 'You are not enrolled in this unit.'], 403);
            }
        }

        // Gate: no duplicate pending request for this lesson
        $alreadyPending = SessionRequest::where('student_id', $student->id)
            ->where('lesson_id', $lesson->id)
            ->where('status', SessionRequest::STATUS_PENDING)
            ->exists();

        if ($alreadyPending) {
            return response()->json(['message' => 'You already have a pending booking for this lesson.'], 422);
        }

        // Resolve teacher (private mode)
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
            'lesson_id'         => $lesson->id,
            'target_teacher_id' => $targetTeacherId,
            'requested_at_utc'  => $validated['scheduled_at'],
            'status'            => SessionRequest::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => $type === SessionRequest::TYPE_PRIVATE
                ? 'Private session request sent to the teacher.'
                : 'Session request sent to the teacher pool.',
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
