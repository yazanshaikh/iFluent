<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\GroupClass;
use App\Models\GroupClassRegistration;
use App\Services\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupClassController extends Controller
{
    public function __construct(private FcmService $fcm) {}

    // ─── Upcoming Classes ─────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $classes = GroupClass::upcoming()
            ->with(['teacher:id,name', 'lesson:id,title'])
            ->paginate(20);

        // Mark which ones the student is registered for
        $myRegistrations = GroupClassRegistration::where('student_id', $student->id)
            ->whereIn('group_class_id', $classes->pluck('id'))
            ->pluck('group_class_id')
            ->flip();

        return response()->json($classes->through(fn($c) => [
            'id'               => $c->id,
            'title'            => $c->title,
            'description'      => $c->description,
            'scheduled_at'     => $c->scheduled_at?->toIso8601String(),
            'teacher'          => ['name' => $c->teacher?->name],
            'lesson'           => $c->lesson ? ['id' => $c->lesson->id, 'title' => $c->lesson->title] : null,
            'max_seats'        => $c->max_seats,
            'registered_count' => $c->registered_count,
            'available_seats'  => $c->availableSeats(),
            'is_registered'    => isset($myRegistrations[$c->id]),
            'is_full'          => !$c->hasSeats(),
        ]));
    }

    // ─── My Registered Classes ────────────────────────────────────────────────

    public function mine(Request $request): JsonResponse
    {
        $student = $request->user();

        $registrations = GroupClassRegistration::where('student_id', $student->id)
            ->with(['groupClass' => fn($q) => $q->with(['teacher:id,name', 'lesson:id,title'])])
            ->orderByDesc('registered_at')
            ->paginate(20);

        return response()->json($registrations->through(fn($r) => [
            'registration_id' => $r->id,
            'registered_at'   => $r->registered_at?->toIso8601String(),
            'class'           => $r->groupClass ? [
                'id'           => $r->groupClass->id,
                'title'        => $r->groupClass->title,
                'status'       => $r->groupClass->status,
                'scheduled_at' => $r->groupClass->scheduled_at?->toIso8601String(),
                'teacher'      => ['name' => $r->groupClass->teacher?->name],
            ] : null,
        ]));
    }

    // ─── Register for a Class ─────────────────────────────────────────────────

    public function register(GroupClass $groupClass, Request $request): JsonResponse
    {
        $student = $request->user();

        if (!$groupClass->isScheduled()) {
            return response()->json(['message' => 'This class is no longer available for registration.'], 422);
        }

        if ($groupClass->isRegistered($student->id)) {
            return response()->json(['message' => 'You are already registered for this class.'], 422);
        }

        // Check seat availability with lock to prevent race condition
        $result = DB::transaction(function () use ($groupClass, $student) {
            $fresh = GroupClass::lockForUpdate()->find($groupClass->id);

            if (!$fresh->hasSeats()) {
                return false;
            }

            GroupClassRegistration::create([
                'group_class_id' => $fresh->id,
                'student_id'     => $student->id,
                'registered_at'  => now(),
            ]);

            $fresh->increment('registered_count');
            return true;
        });

        if (!$result) {
            return response()->json(['message' => 'Sorry, this class is now full.'], 422);
        }

        return response()->json([
            'message'         => 'Successfully registered for the class.',
            'available_seats' => $groupClass->fresh()->availableSeats(),
        ], 201);
    }

    // ─── Leave / Unregister ───────────────────────────────────────────────────

    public function leave(GroupClass $groupClass, Request $request): JsonResponse
    {
        $student = $request->user();

        if (!$groupClass->isScheduled()) {
            return response()->json(['message' => 'Cannot leave a class that has already started.'], 422);
        }

        $registration = GroupClassRegistration::where('group_class_id', $groupClass->id)
            ->where('student_id', $student->id)
            ->first();

        if (!$registration) {
            return response()->json(['message' => 'You are not registered for this class.'], 422);
        }

        DB::transaction(function () use ($registration, $groupClass) {
            $registration->delete();
            $groupClass->decrement('registered_count');
        });

        return response()->json(['message' => 'Successfully unregistered from the class.']);
    }

    // ─── Join Active Class ────────────────────────────────────────────────────

    public function join(GroupClass $groupClass, Request $request): JsonResponse
    {
        $student = $request->user();

        if (!$groupClass->isActive()) {
            return response()->json([
                'message' => $groupClass->isScheduled()
                    ? 'Class has not started yet. Please wait for the teacher.'
                    : 'This class is no longer active.',
            ], 422);
        }

        $registration = GroupClassRegistration::where('group_class_id', $groupClass->id)
            ->where('student_id', $student->id)
            ->first();

        if (!$registration) {
            return response()->json(['message' => 'You are not registered for this class.'], 403);
        }

        // Mark join time (first time only)
        if (!$registration->joined_at) {
            $registration->update(['joined_at' => now()]);
        }

        return response()->json([
            'class_id'       => $groupClass->id,
            'title'          => $groupClass->title,
            'daily_room_url' => $groupClass->daily_room_url,
            'teacher'        => ['name' => $groupClass->teacher?->name],
        ]);
    }
}
