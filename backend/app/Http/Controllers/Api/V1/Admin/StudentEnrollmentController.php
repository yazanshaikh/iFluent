<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UnitResource;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StudentEnrollmentController extends Controller
{
    // ─── List Student's Enrolled Units ────────────────────────────────────────

    public function index(int $studentId): AnonymousResourceCollection|JsonResponse
    {
        $student = $this->resolveStudent($studentId);
        if ($student instanceof JsonResponse) return $student;

        $units = $student->enrolledUnits()
            ->with('level')
            ->orderBy('level_id')
            ->orderBy('order')
            ->get();

        return UnitResource::collection($units);
    }

    // ─── Enroll Student in Units ──────────────────────────────────────────────

    /**
     * Admin assigns purchased units to a student (after subscription approval).
     * Accepts an array of unit_ids. Already-enrolled units are skipped.
     */
    public function enroll(Request $request, int $studentId): JsonResponse
    {
        $student = $this->resolveStudent($studentId);
        if ($student instanceof JsonResponse) return $student;

        $request->validate([
            'unit_ids'   => ['required', 'array', 'min:1'],
            'unit_ids.*' => ['integer', 'exists:units,id'],
        ]);

        $unitIds = collect($request->unit_ids)->unique();

        // Attach only units not already enrolled (avoid unique constraint errors)
        $alreadyEnrolled = $student->enrolledUnits()->pluck('unit_id');
        $toEnroll        = $unitIds->diff($alreadyEnrolled);

        if ($toEnroll->isNotEmpty()) {
            $syncData = $toEnroll->mapWithKeys(fn($id) => [
                $id => ['status' => 'active', 'enrolled_at' => now()],
            ])->toArray();

            $student->enrolledUnits()->attach($syncData);
        }

        return response()->json([
            'message'       => 'Units enrolled successfully.',
            'enrolled_now'  => $toEnroll->values(),
            'already_had'   => $alreadyEnrolled->intersect($unitIds)->values(),
        ]);
    }

    // ─── Revoke Unit Enrollment ───────────────────────────────────────────────

    public function revoke(Request $request, int $studentId): JsonResponse
    {
        $student = $this->resolveStudent($studentId);
        if ($student instanceof JsonResponse) return $student;

        $request->validate([
            'unit_ids'   => ['required', 'array', 'min:1'],
            'unit_ids.*' => ['integer', 'exists:units,id'],
        ]);

        $student->enrolledUnits()->detach($request->unit_ids);

        return response()->json(['message' => 'Unit enrollment revoked.']);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function resolveStudent(int $id): User|JsonResponse
    {
        $student = User::find($id);

        if (!$student || !$student->isStudent()) {
            return response()->json(['message' => 'Student not found.'], 404);
        }

        return $student;
    }
}
