<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Models\GroupClass;
use App\Models\GroupClassRegistration;
use App\Services\DailyCoService;
use App\Services\FcmService;
use App\Services\GroupClassService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupClassController extends Controller
{
    public function __construct(
        private DailyCoService $daily,
        private FcmService $fcm
    ) {}

    // ─── List Teacher's Group Classes ─────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $classes = GroupClass::forTeacher($request->user()->id)
            ->with(['lesson.unit.level', 'lesson.level'])
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->orderByDesc('scheduled_at')
            ->paginate(20);

        return response()->json($classes->through(fn($c) => $this->format($c)));
    }

    // ─── Show Group Class ─────────────────────────────────────────────────────

    public function show(GroupClass $groupClass, Request $request): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $groupClass->load(['lesson.unit.level', 'lesson.level', 'registrations.student:id,name']);

        return response()->json([
            'class'       => $this->format($groupClass),
            'registered'  => $groupClass->registrations->map(fn($r) => [
                'student_id'    => $r->student_id,
                'name'          => $r->student?->name,
                'registered_at' => $r->registered_at?->toIso8601String(),
                'joined'        => $r->joined_at !== null,
            ]),
        ]);
    }

    // ─── Start Class (creates Daily room) ────────────────────────────────────

    public function start(GroupClass $groupClass, Request $request): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$groupClass->isScheduled()) {
            return response()->json(['message' => "Class cannot be started. Status: {$groupClass->status}."], 422);
        }

        // Same window as individual lessons: from 15 minutes before to 15 minutes after.
        $scheduled = $groupClass->scheduled_at;
        if (now()->isBefore($scheduled->copy()->subMinutes(15))) {
            return response()->json([
                'message'      => 'لا يمكن تفعيل الحصة الآن',
                'reason'       => 'too_early',
                'details'      => 'ممكن تفعيل الحصة قبل موعدها بـ 15 دقيقة فقط',
                'can_start_at' => $scheduled->copy()->subMinutes(15)->toIso8601String(),
            ], 422);
        }
        if (now()->isAfter($scheduled->copy()->addMinutes(15))) {
            return response()->json([
                'message' => 'انتهى وقت تفعيل الحصة',
                'reason'  => 'too_late',
                'details' => 'يمكن تفعيل الحصة حتى 15 دقيقة بعد الموعد فقط',
            ], 422);
        }

        // The Nearpod PIN is required to start, as for individual lessons.
        $validated = $request->validate(['nearpod_pin' => ['required', 'string', 'max:50']]);

        $busy = \App\Models\Session::where('teacher_id', $request->user()->id)
                ->where('status', \App\Models\Session::STATUS_ACTIVE)->exists()
            || GroupClass::where('teacher_id', $request->user()->id)
                ->where('status', GroupClass::STATUS_ACTIVE)->whereKeyNot($groupClass->id)->exists();
        if ($busy) {
            return response()->json(['message' => 'لديك حصة نشطة حالياً. يرجى إنهاؤها قبل بدء حصة جديدة.'], 422);
        }

        // Create Daily.co room with enough capacity (max_seats + 1 for teacher)
        $roomData = $this->daily->createGroupRoom($groupClass);

        $groupClass->update([
            'status'          => GroupClass::STATUS_ACTIVE,
            'daily_room_name' => $roomData['room_name'],
            'daily_room_url'  => $roomData['room_url'],
            'nearpod_pin'     => trim($validated['nearpod_pin']),
            'started_at'      => now(),
        ]);

        return response()->json([
            'message'       => 'Group class started.',
            'daily_room_url'=> $this->ownerRoomUrl($groupClass->fresh()),
            'class'         => $this->format($groupClass->fresh()),
        ]);
    }

    // ─── Save / change the Nearpod PIN ────────────────────────────────────────

    /** PATCH /teacher/group-classes/{id}/pin — students see it once they join. */
    public function pin(GroupClass $groupClass, Request $request): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$groupClass->isScheduled() && !$groupClass->isActive()) {
            return response()->json(['message' => 'The class has ended.'], 422);
        }

        $validated = $request->validate(['nearpod_pin' => ['required', 'string', 'max:50']]);
        $groupClass->update(['nearpod_pin' => trim($validated['nearpod_pin'])]);

        return response()->json(['message' => 'PIN saved.', 'nearpod_pin' => $groupClass->nearpod_pin]);
    }

    // ─── Room link for the teacher ────────────────────────────────────────────

    /**
     * GET /teacher/group-classes/{id}/room — the live room with an owner token,
     * so the teacher can mute students (one or all) and manage the room.
     */
    public function room(GroupClass $groupClass, Request $request): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$groupClass->isActive() || !$groupClass->daily_room_url) {
            return response()->json(['message' => 'Class is not active.'], 422);
        }

        return response()->json(['daily_room_url' => $this->ownerRoomUrl($groupClass)]);
    }

    private function ownerRoomUrl(GroupClass $groupClass): string
    {
        $token = $this->daily->createMeetingToken($groupClass->daily_room_name, true);

        return $groupClass->daily_room_url . (str_contains($groupClass->daily_room_url, '?') ? '&' : '?') . 't=' . $token;
    }

    // ─── End Class ────────────────────────────────────────────────────────────

    public function end(GroupClass $groupClass, Request $request, GroupClassService $classes): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$groupClass->isActive()) {
            return response()->json(['message' => 'Class is not active.'], 422);
        }

        if ($groupClass->daily_room_name) {
            $this->daily->deleteRoom($groupClass->daily_room_name);
        }

        $classes->complete($groupClass);

        return response()->json(['message' => 'Group class ended.', 'class' => $this->format($groupClass->fresh())]);
    }

    // ─── Cancel Class ─────────────────────────────────────────────────────────

    public function cancel(GroupClass $groupClass, Request $request, GroupClassService $classes): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$classes->cancel($groupClass)) {
            return response()->json(['message' => 'Only scheduled classes can be cancelled.'], 422);
        }

        return response()->json(['message' => 'Group class cancelled.']);
    }

    // ─── Format ───────────────────────────────────────────────────────────────

    private function format(GroupClass $c): array
    {
        return [
            'id'               => $c->id,
            'title'            => $c->title,
            'description'      => $c->description,
            'status'           => $c->status,
            'scheduled_at'     => $c->scheduled_at?->toIso8601String(),
            'started_at'       => $c->started_at?->toIso8601String(),
            'ended_at'         => $c->ended_at?->toIso8601String(),
            'max_seats'        => $c->max_seats,
            'registered_count' => $c->registered_count,
            'available_seats'  => $c->availableSeats(),
            'lesson'           => $c->lesson ? [
                'id'          => $c->lesson->id,
                'title'       => $c->lesson->title,
                'order'       => $c->lesson->order,
                'nearpod_url' => $c->lesson->nearpod_url,
                'level'       => ($level = $c->lesson->unit?->level ?? $c->lesson->level)
                    ? ['code' => $level->code, 'name' => $level->name]
                    : null,
            ] : null,
            'nearpod_pin'      => $c->nearpod_pin,
            'daily_room_url'   => $c->isActive() ? $c->daily_room_url : null,
        ];
    }
}
