<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LevelResource;
use App\Http\Resources\Api\V1\UnitResource;
use App\Models\Level;
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
        $units = $request->user()
            ->enrolledUnits()
            ->where('student_units.status', 'active')
            ->with(['level', 'lessons' => fn($q) => $q->active()])
            ->orderBy('level_id')
            ->orderBy('order')
            ->get();

        return UnitResource::collection($units);
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
