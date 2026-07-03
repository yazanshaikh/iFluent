<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionRequest;
use App\Services\DailyCoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Teacher Requests Center — 3 tabs:
 *   - Pool     → unassigned core/demo requests (any teacher can accept)
 *   - Private  → requests directed to this teacher by teacher_code
 *   - Upcoming → confirmed sessions
 *
 * Accept flow:
 *   Teacher accepts → Daily.co room created → Session row inserted →
 *   session_request.status = confirmed, linked to session_id
 *
 * Reject flow:
 *   - Private: returned to student/staff as 'rejected'
 *   - Core/Demo: re-enters pool (assigned_teacher_id cleared)
 */
class RequestController extends Controller
{
    public function __construct(private DailyCoService $daily) {}

    // ─── Pool (core + demo, unassigned) ──────────────────────────────────────

    public function pool(Request $request): JsonResponse
    {
        $requests = SessionRequest::pool()
            ->with(['student:id,name', 'lesson:id,title,unit_id,is_assessment', 'lead:id,name,phone'])
            ->orderBy('requested_at_utc')
            ->paginate(20);

        return response()->json($requests->through(fn($r) => $this->formatRequest($r)));
    }

    // ─── Private Requests (directed to this teacher) ──────────────────────────

    public function privateRequests(Request $request): JsonResponse
    {
        $teacherUserId = $request->user()->id;

        $requests = SessionRequest::where('target_teacher_id', $teacherUserId)
            ->where('status', SessionRequest::STATUS_PENDING)
            ->with(['student:id,name', 'lesson:id,title,unit_id,is_assessment'])
            ->orderBy('requested_at_utc')
            ->paginate(20);

        return response()->json($requests->through(fn($r) => $this->formatRequest($r)));
    }

    // ─── My Requests (all pending requests visible to this teacher) ───────────

    public function index(Request $request): JsonResponse
    {
        $teacher = $request->user();

        $requests = SessionRequest::forTeacher($teacher->id)
            ->where('status', SessionRequest::STATUS_PENDING)
            ->with(['student:id,name', 'lesson:id,title,order,is_assessment,nearpod_url,level_id,unit_id', 'lesson.level:id,code,name', 'lesson.unit.level:id,code,name', 'lead:id,name,phone'])
            ->when(
                $request->filled('type'),
                fn($q) => $q->where('type', $request->type)
            )
            ->orderBy('requested_at_utc')
            ->paginate(20);

        return response()->json($requests->through(fn($r) => $this->formatRequest($r)));
    }

    // ─── Show Single Request ──────────────────────────────────────────────────

    public function show(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        $teacher = $request->user();

        // Must be visible to this teacher
        $canSee = $sessionRequest->target_teacher_id === $teacher->id
            || (in_array($sessionRequest->type, [SessionRequest::TYPE_CORE, SessionRequest::TYPE_DEMO])
                && is_null($sessionRequest->assigned_teacher_id));

        if (!$canSee) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $sessionRequest->load([
            'student:id,name',
            'lesson:id,title,order,is_assessment,nearpod_url,level_id,unit_id',
            'lesson.level:id,code,name',
            'lesson.unit.level:id,code,name',
        ]);

        return response()->json(['data' => $this->formatRequest($sessionRequest)]);
    }

    // ─── Accept Request ───────────────────────────────────────────────────────

    public function accept(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        $teacher = $request->user();

        if (!$sessionRequest->isPending()) {
            return response()->json(['message' => 'This request is no longer pending.'], 422);
        }

        // Verify teacher is eligible for this request
        if (
            $sessionRequest->target_teacher_id &&
            $sessionRequest->target_teacher_id !== $teacher->id
        ) {
            return response()->json(['message' => 'This request is directed to another teacher.'], 403);
        }

        // ── 1-hour gap rule ───────────────────────────────────────────────────
        // Block if the teacher already has a session within 1 hour of this slot.
        $slot = $sessionRequest->requested_at_utc;
        if ($slot) {
            $conflict = \App\Models\Session::where('teacher_id', $teacher->id)
                ->whereIn('status', [
                    \App\Models\Session::STATUS_WAITING,
                    \App\Models\Session::STATUS_ACTIVE,
                ])
                ->whereBetween('scheduled_at', [
                    $slot->copy()->subMinutes(59),
                    $slot->copy()->addMinutes(59),
                ])
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'لديك حصة أخرى ضمن ساعة من هذا الموعد. يجب أن يفصل بين الحصص ساعة على الأقل.',
                ], 422);
            }
        }

        $validated = $request->validate([
            'nearpod_pin' => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        // Use a DB transaction + lock to prevent double-acceptance from pool
        $session = DB::transaction(function () use ($sessionRequest, $teacher, $validated) {
            // Re-fetch with lock to prevent race condition on pool requests
            $locked = SessionRequest::lockForUpdate()->find($sessionRequest->id);

            if (!$locked->isPending()) {
                return null; // Already taken
            }

            // Create Daily.co room — we use a temporary Session-like object
            // We create the Session first, then create the Daily room
            $session = Session::create([
                'lesson_id'    => $locked->lesson_id,
                'teacher_id'   => $teacher->id,
                'student_id'   => $locked->student_id,   // null for a lead-only trial
                'lead_id'      => $locked->lead_id,       // keep the lead link so they can join
                'status'       => Session::STATUS_WAITING,
                'scheduled_at' => $locked->requested_at_utc,
                'nearpod_pin'  => $validated['nearpod_pin'] ?? null,
            ]);

            // Create Daily.co room
            $roomData = $this->daily->createRoom($session);

            $session->update([
                'daily_room_name' => $roomData['room_name'],
                'daily_room_url'  => $roomData['room_url'],
            ]);

            // Update the request
            $locked->update([
                'status'              => SessionRequest::STATUS_CONFIRMED,
                'assigned_teacher_id' => $teacher->id,
                'confirmed_at'        => now(),
                'session_id'          => $session->id,
            ]);

            return $session;
        });

        if (!$session) {
            return response()->json(['message' => 'This request was just accepted by another teacher.'], 409);
        }

        return response()->json([
            'message' => 'Request accepted. Session created.',
            'session' => [
                'id'           => $session->id,
                'status'       => $session->status,
                'scheduled_at' => $session->scheduled_at?->toIso8601String(),
                'lesson_id'    => $session->lesson_id,
                'student_id'   => $session->student_id,
            ],
        ], 201);
    }

    // ─── Reject Request ───────────────────────────────────────────────────────

    public function reject(SessionRequest $sessionRequest, Request $request): JsonResponse
    {
        $teacher = $request->user();

        if (!$sessionRequest->isPending()) {
            return response()->json(['message' => 'This request is no longer pending.'], 422);
        }

        // Verify eligibility
        if (
            $sessionRequest->target_teacher_id &&
            $sessionRequest->target_teacher_id !== $teacher->id
        ) {
            return response()->json(['message' => 'This request is directed to another teacher.'], 403);
        }

        $validated = $request->validate([
            'reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        if ($sessionRequest->type === SessionRequest::TYPE_PRIVATE) {
            // Private rejection: mark as rejected, student/staff notified
            $sessionRequest->update([
                'status'           => SessionRequest::STATUS_REJECTED,
                'rejection_reason' => $validated['reason'] ?? null,
            ]);

            return response()->json(['message' => 'Private session request rejected.']);
        }

        // Core/Demo: re-enter the pool (clear assigned_teacher_id, stay pending)
        // No status change — request remains available for other teachers
        // We just log the rejection optionally
        return response()->json(['message' => 'Request returned to the pool.']);
    }

    // ─── Private Helper ───────────────────────────────────────────────────────

    private function formatRequest(SessionRequest $r): array
    {
        // Student age via their linked lead record
        $age = null;
        if ($r->student_id) {
            $studentProfile = \App\Models\Student::where('user_id', $r->student_id)
                ->with('lead:id,age')
                ->first();
            $age = $studentProfile?->lead?->age;
        }

        return [
            'id'                  => $r->id,
            'type'                => $r->type,
            'status'              => $r->status,
            'scheduled_at'        => $r->requested_at_utc?->toIso8601String(),
            'teacher_gender_pref' => $r->teacher_gender_pref,
            'note'                => $r->note,
            'student'      => $r->student ? [
                'id'   => $r->student->id,
                'name' => $r->student->name,
                'age'  => $age,
            ] : null,
            // Landing/CRM trial bookings belong to a lead (no student account yet),
            // so `student` is null — expose the lead so the teacher still sees who
            // the assessment is for. Null-safe: real student requests have no lead.
            'lead'         => $r->lead ? [
                'id'    => $r->lead->id,
                'name'  => $r->lead->name,
                'phone' => $r->lead->phone,
            ] : null,
            'lesson'       => $r->lesson ? [
                'id'           => $r->lesson->id,
                'title'        => $r->lesson->title,
                'order'        => $r->lesson->order,
                'is_assessment'=> $r->lesson->is_assessment,
                'nearpod_url'  => $r->lesson->nearpod_url,
                'level'        => ($r->lesson->level ?? $r->lesson->unit?->level) ? [
                    'code' => ($r->lesson->level ?? $r->lesson->unit->level)->code,
                    'name' => ($r->lesson->level ?? $r->lesson->unit->level)->name,
                ] : null,
            ] : null,
        ];
    }
}
