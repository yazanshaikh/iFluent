<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Models\TeacherAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Teacher manages their own weekly availability slots.
 *
 * Slots are stored in UTC. Frontend sends UTC times.
 * Students see slots in Jordan Time (UTC+3) — conversion done client-side.
 *
 * day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
class AvailabilityController extends Controller
{
    // ─── List Teacher's Own Availability ─────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $slots = TeacherAvailability::forTeacher($request->user()->id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'availability' => $slots->map(fn($s) => $this->formatSlot($s)),
        ]);
    }

    // ─── Add Availability Slot ────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'start_time'  => ['required', 'date_format:H:i'],
            'end_time'    => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        // Check for overlap with existing slots on the same day
        $overlapping = TeacherAvailability::where('teacher_id', $request->user()->id)
            ->where('day_of_week', $validated['day_of_week'])
            ->where('is_active', true)
            ->where(function ($q) use ($validated) {
                $q->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                  ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                  ->orWhere(function ($q2) use ($validated) {
                      $q2->where('start_time', '<=', $validated['start_time'])
                         ->where('end_time', '>=', $validated['end_time']);
                  });
            })
            ->exists();

        if ($overlapping) {
            return response()->json(['message' => 'This slot overlaps with an existing availability slot.'], 422);
        }

        $slot = TeacherAvailability::create([
            'teacher_id'  => $request->user()->id,
            'day_of_week' => $validated['day_of_week'],
            'start_time'  => $validated['start_time'],
            'end_time'    => $validated['end_time'],
            'is_active'   => true,
        ]);

        return response()->json([
            'message' => 'Availability slot added.',
            'slot'    => $this->formatSlot($slot),
        ], 201);
    }

    // ─── Update Slot ──────────────────────────────────────────────────────────

    public function update(TeacherAvailability $availability, Request $request): JsonResponse
    {
        // Only the owning teacher can update
        if ($availability->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'day_of_week' => ['sometimes', 'integer', 'min:0', 'max:6'],
            'start_time'  => ['sometimes', 'date_format:H:i'],
            'end_time'    => ['sometimes', 'date_format:H:i'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        $availability->update($validated);

        return response()->json([
            'message' => 'Slot updated.',
            'slot'    => $this->formatSlot($availability->fresh()),
        ]);
    }

    // ─── Delete Slot ──────────────────────────────────────────────────────────

    public function destroy(TeacherAvailability $availability, Request $request): JsonResponse
    {
        if ($availability->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $availability->delete();

        return response()->json(['message' => 'Availability slot removed.']);
    }

    // ─── Bulk Replace (replace all slots at once) ─────────────────────────────

    /**
     * Client sends the complete weekly schedule.
     * All existing slots are replaced.
     *
     * Body: { "slots": [ { day_of_week, start_time, end_time }, ... ] }
     */
    public function bulkReplace(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slots'               => ['required', 'array'],
            'slots.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'slots.*.start_time'  => ['required', 'date_format:H:i'],
            'slots.*.end_time'    => ['required', 'date_format:H:i', 'after:slots.*.start_time'],
        ]);

        $teacherId = $request->user()->id;

        \Illuminate\Support\Facades\DB::transaction(function () use ($teacherId, $validated) {
            // Remove all existing slots
            TeacherAvailability::where('teacher_id', $teacherId)->delete();

            // Insert new slots
            foreach ($validated['slots'] as $slot) {
                TeacherAvailability::create([
                    'teacher_id'  => $teacherId,
                    'day_of_week' => $slot['day_of_week'],
                    'start_time'  => $slot['start_time'],
                    'end_time'    => $slot['end_time'],
                    'is_active'   => true,
                ]);
            }
        });

        $slots = TeacherAvailability::forTeacher($teacherId)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'message'      => 'Availability schedule updated.',
            'availability' => $slots->map(fn($s) => $this->formatSlot($s)),
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function formatSlot(TeacherAvailability $slot): array
    {
        return [
            'id'          => $slot->id,
            'day_of_week' => $slot->day_of_week,
            'day_name'    => $slot->day_name,
            'start_time'  => $slot->start_time,
            'end_time'    => $slot->end_time,
            'is_active'   => $slot->is_active,
        ];
    }
}
