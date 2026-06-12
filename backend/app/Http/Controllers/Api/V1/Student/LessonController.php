<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LevelResource;
use App\Http\Resources\Api\V1\UnitResource;
use App\Models\Lesson;
use App\Models\Level;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LessonController extends Controller
{
    // ─── List Enrolled Units (grouped by level) ───────────────────────────────

    /**
     * Returns only the units the student has purchased/been enrolled in,
     * with their lessons. This is the main "curriculum" view.
     */
    public function enrolledUnits(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        // Only ever expose lessons the student has PAID for (union of active
        // subscription ranges). This keeps a partially-covered unit from leaking
        // its earlier, unpaid lessons.
        $paidLessonIds = \App\Models\Subscription::paidLessonIdsForUser($user->id);

        $units = $user
            ->enrolledUnits()
            ->where('student_units.status', 'active')
            ->with(['level', 'lessons' => fn($q) => $q->active()->whereIn('id', $paidLessonIds)])
            ->orderBy('level_id')
            ->orderBy('order')
            ->get()
            // Drop units that end up with zero paid lessons (defensive)
            ->filter(fn($u) => $u->lessons->isNotEmpty())
            ->values();

        return UnitResource::collection($units);
    }

    // ─── Single Lesson ────────────────────────────────────────────────────────

    /**
     * GET /student/lessons/{lesson}
     * Returns a single lesson's details (incl. its interactive activity link).
     */
    public function show(Lesson $lesson): JsonResponse
    {
        return response()->json([
            'data' => [
                'id'            => $lesson->id,
                'title'         => $lesson->title,
                'order'         => $lesson->order,
                'is_active'     => $lesson->is_active,
                'is_assessment' => $lesson->is_assessment,
                'activity_url'  => $lesson->activity_url,
            ],
        ]);
    }

    // ─── List Assessment Lessons ──────────────────────────────────────────────

    /**
     * GET /student/assessment-lessons
     * Returns active assessment lessons so a non-subscribed student
     * can pick one to book a free evaluation session.
     */
    public function assessmentLessons(): JsonResponse
    {
        $lessons = Lesson::with('level')
            ->assessment()
            ->active()
            ->get()
            ->map(fn($l) => [
                'id'    => $l->id,
                'title' => $l->title,
                'level' => $l->level ? ['id' => $l->level->id, 'code' => $l->level->code, 'name' => $l->level->name] : null,
            ]);

        return response()->json(['data' => $lessons]);
    }

    // ─── List All Levels (public curriculum structure) ────────────────────────

    /**
     * Shows the full curriculum structure — levels and their units.
     * Students can see the overall roadmap even before enrolling.
     * Lesson details (Nearpod) are hidden here.
     */
    public function levels(): AnonymousResourceCollection
    {
        $levels = Level::active()->with(['units' => fn($q) => $q->active()])->get();

        return LevelResource::collection($levels);
    }
}
