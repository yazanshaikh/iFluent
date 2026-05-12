<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Models\GroupClass;
use App\Models\GroupClassRegistration;
use App\Services\DailyCoService;
use App\Services\FcmService;
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
            ->with(['lesson:id,title'])
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->orderByDesc('scheduled_at')
            ->paginate(20);

        return response()->json($classes->through(fn($c) => $this->format($c)));
    }

    // ─── Create Group Class ───────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'        => ['required', 'string', 'max:200'],
            'description'  => ['sometimes', 'nullable', 'string'],
            'lesson_id'    => ['sometimes', 'nullable', 'integer', 'exists:lessons,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'max_seats'    => ['sometimes', 'integer', 'min:2', 'max:200'],
        ]);

        $class = GroupClass::create([
            'teacher_id'   => $request->user()->id,
            'title'        => $validated['title'],
            'description'  => $validated['description'] ?? null,
            'lesson_id'    => $validated['lesson_id'] ?? null,
            'scheduled_at' => $validated['scheduled_at'],
            'max_seats'    => $validated['max_seats'] ?? 20,
            'status'       => GroupClass::STATUS_SCHEDULED,
        ]);

        return response()->json([
            'message' => 'Group class created.',
            'class'   => $this->format($class),
        ], 201);
    }

    // ─── Show Group Class ─────────────────────────────────────────────────────

    public function show(GroupClass $groupClass, Request $request): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $groupClass->load(['lesson:id,title', 'registrations.student:id,name']);

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

        // Create Daily.co room with enough capacity (max_seats + 1 for teacher)
        $roomName = 'ifluent-group-' . $groupClass->id . '-' . time();
        $roomData = $this->daily->createGroupRoom($groupClass);

        $groupClass->update([
            'status'          => GroupClass::STATUS_ACTIVE,
            'daily_room_name' => $roomData['room_name'],
            'daily_room_url'  => $roomData['room_url'],
            'started_at'      => now(),
        ]);

        return response()->json([
            'message'       => 'Group class started.',
            'daily_room_url'=> $groupClass->daily_room_url,
            'class'         => $this->format($groupClass->fresh()),
        ]);
    }

    // ─── End Class ────────────────────────────────────────────────────────────

    public function end(GroupClass $groupClass, Request $request): JsonResponse
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

        $groupClass->update([
            'status'   => GroupClass::STATUS_COMPLETED,
            'ended_at' => now(),
        ]);

        return response()->json(['message' => 'Group class ended.', 'class' => $this->format($groupClass->fresh())]);
    }

    // ─── Cancel Class ─────────────────────────────────────────────────────────

    public function cancel(GroupClass $groupClass, Request $request): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$groupClass->isScheduled()) {
            return response()->json(['message' => 'Only scheduled classes can be cancelled.'], 422);
        }

        $groupClass->update(['status' => GroupClass::STATUS_CANCELLED]);

        return response()->json(['message' => 'Group class cancelled.']);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(GroupClass $groupClass, Request $request): JsonResponse
    {
        if ($groupClass->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$groupClass->isScheduled()) {
            return response()->json(['message' => 'Only scheduled classes can be edited.'], 422);
        }

        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:200'],
            'description'  => ['sometimes', 'nullable', 'string'],
            'scheduled_at' => ['sometimes', 'date', 'after:now'],
            'max_seats'    => ['sometimes', 'integer', 'min:2', 'max:200'],
            'lesson_id'    => ['sometimes', 'nullable', 'integer', 'exists:lessons,id'],
        ]);

        // max_seats can't go below current registrations
        if (isset($validated['max_seats']) && $validated['max_seats'] < $groupClass->registered_count) {
            return response()->json(['message' => 'Max seats cannot be less than current registrations (' . $groupClass->registered_count . ').'], 422);
        }

        $groupClass->update($validated);

        return response()->json(['message' => 'Class updated.', 'class' => $this->format($groupClass->fresh())]);
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
            'lesson'           => $c->lesson ? ['id' => $c->lesson->id, 'title' => $c->lesson->title] : null,
            'daily_room_url'   => $c->isActive() ? $c->daily_room_url : null,
        ];
    }
}
