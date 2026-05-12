<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Lesson;
use App\Models\SessionRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CRM Demo Booking — Sales Staff books a demo session for a lead.
 *
 * Flow:
 *   1. CC/SS picks a date/time and optionally a teacher (by teacher_code)
 *   2. System creates a session_request of type=demo
 *   3. If target_teacher_id set: directed to that teacher
 *   4. If no teacher: goes to pool (any teacher can accept)
 *   5. Teacher accepts → Daily.co room created → session started when teacher clicks start
 */
class DemoBookingController extends Controller
{
    public function store(Lead $lead, Request $request): JsonResponse
    {
        $staff = $request->user();

        // Lead must have a student account (checkout done) or be in working/subscriber state
        // Demo sessions can be booked at any lead stage — the lesson is an assessment lesson
        $assessmentLesson = null;

        $validated = $request->validate([
            'lesson_id'    => ['sometimes', 'nullable', 'integer', 'exists:lessons,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'teacher_code' => ['sometimes', 'nullable', 'string'],
            'notes'        => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        // If lesson_id provided, use it; otherwise pick any active assessment lesson
        if (!empty($validated['lesson_id'])) {
            $lesson = Lesson::findOrFail($validated['lesson_id']);
            if (!$lesson->is_assessment) {
                return response()->json(['message' => 'Demo sessions must use an assessment lesson.'], 422);
            }
        } else {
            // Default: use first available assessment lesson
            $lesson = Lesson::assessment()->where('is_active', true)->orderBy('order')->first();
            if (!$lesson) {
                return response()->json(['message' => 'No assessment lessons available.'], 422);
            }
        }

        // Resolve the student user account (if lead has been converted)
        $studentUserId = null;
        if ($lead->student) {
            $studentUserId = $lead->student->user_id;
        }

        // Resolve teacher by teacher_code if provided
        $targetTeacherId = null;
        if (!empty($validated['teacher_code'])) {
            $teacher = \App\Models\Teacher::where('teacher_code', $validated['teacher_code'])
                ->where('is_active', true)
                ->first();

            if (!$teacher) {
                return response()->json(['message' => 'Teacher not found with that code.'], 404);
            }

            $targetTeacherId = $teacher->user_id;
        }

        // For demo requests, student_id can be the lead's student user OR we store null
        // and rely on lead_id to identify who it's for.
        // If student account exists, use it; otherwise the session will be linked to the lead.
        $sessionRequest = SessionRequest::create([
            'type'              => SessionRequest::TYPE_DEMO,
            'requested_by'      => $staff->id,
            'student_id'        => $studentUserId ?? $staff->id, // fallback to staff if no student yet
            'lesson_id'         => $lesson->id,
            'lead_id'           => $lead->id,
            'target_teacher_id' => $targetTeacherId,
            'requested_at_utc'  => $validated['scheduled_at'],
            'status'            => SessionRequest::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => $targetTeacherId
                ? 'Demo session request sent to the selected teacher.'
                : 'Demo session request sent to the teacher pool.',
            'request' => [
                'id'           => $sessionRequest->id,
                'type'         => $sessionRequest->type,
                'status'       => $sessionRequest->status,
                'scheduled_at' => $sessionRequest->requested_at_utc->toIso8601String(),
                'lesson'       => ['id' => $lesson->id, 'title' => $lesson->title],
                'lead_id'      => $lead->id,
            ],
        ], 201);
    }

    // ─── List Demo Requests for a Lead ───────────────────────────────────────

    public function index(Lead $lead): JsonResponse
    {
        $requests = SessionRequest::where('lead_id', $lead->id)
            ->where('type', SessionRequest::TYPE_DEMO)
            ->with(['assignedTeacher:id,name', 'lesson:id,title'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'requests' => $requests->map(fn($r) => [
                'id'           => $r->id,
                'status'       => $r->status,
                'scheduled_at' => $r->requested_at_utc?->toIso8601String(),
                'lesson'       => $r->lesson ? ['id' => $r->lesson->id, 'title' => $r->lesson->title] : null,
                'teacher'      => $r->assignedTeacher ? ['name' => $r->assignedTeacher->name] : null,
                'session_id'   => $r->session_id,
            ]),
        ]);
    }

    // ─── Cancel Demo Request ──────────────────────────────────────────────────

    public function cancel(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        if (!$sessionRequest->isPending()) {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        $sessionRequest->update([
            'status'              => SessionRequest::STATUS_CANCELLED,
            'cancellation_reason' => $request->input('reason'),
        ]);

        return response()->json(['message' => 'Demo request cancelled.']);
    }
}
