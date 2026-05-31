<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LessonResource;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Admin ONLY:
 *   - Update nearpod_url / nearpod_lesson_id for ANY lesson (regular or assessment)
 *   - Update assessment lesson metadata (level, title, is_active)
 *   - View all assessment lessons
 *
 * CC/SS cannot reach any write endpoint here.
 */
class LessonController extends Controller
{
    // ─── List All Active Lessons (lesson-range picker) ────────────────────────

    /**
     * GET /admin/lessons
     * All active regular lessons, ordered by curriculum position.
     * Used by CRM to populate from_lesson_id / to_lesson_id dropdowns.
     */
    public function index(): AnonymousResourceCollection
    {
        $lessons = Lesson::with(['unit.level'])
            ->active()
            ->regular()
            ->get()
            ->sortBy(fn($l) => [
                $l->unit->level->order ?? 999,
                $l->unit->order        ?? 999,
                $l->order              ?? 999,
            ])
            ->values();

        return LessonResource::collection($lessons);
    }

    // ─── List Assessment Lessons ──────────────────────────────────────────────
    // Accessible by CC/SS via /crm/assessment-lessons (read-only there).
    // Also accessible by admin via /admin/assessment-lessons for management.

    public function assessments(): AnonymousResourceCollection
    {
        $lessons = Lesson::with('level')
            ->assessment()   // scope: is_assessment = true
            ->orderBy('level_id')
            ->get();

        return LessonResource::collection($lessons);
    }

    // ─── Update Lesson Content (nearpod) — Admin Only ─────────────────────────

    /**
     * PUT /admin/lessons/{lesson}/content
     *
     * Works for BOTH regular lessons and assessment lessons.
     * Only nearpod fields + cosmetic fields (title, description, is_active).
     * Does NOT allow changing level_id or unit_id (use updateAssessment for that).
     *
     * No cache anywhere — changes are reflected instantly the next time
     * a student calls the /join endpoint.
     */
    public function updateContent(Request $request, Lesson $lesson): LessonResource|JsonResponse
    {
        $validated = $request->validate([
            'nearpod_lesson_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'nearpod_url'       => ['sometimes', 'nullable', 'url', 'max:500'],
            'title'             => ['sometimes', 'string', 'max:200'],
            'description'       => ['sometimes', 'nullable', 'string'],
            'is_active'         => ['sometimes', 'boolean'],
        ]);

        $lesson->update($validated);

        return new LessonResource(
            $lesson->fresh()->load($lesson->is_assessment ? 'level' : 'unit.level')
        );
    }

    // ─── Update Assessment Lesson Metadata — Admin Only ───────────────────────

    /**
     * PUT /admin/assessment-lessons/{lesson}
     *
     * Assessment-specific fields only (level reassignment + content).
     * Regular lessons cannot be reached via this endpoint.
     */
    public function updateAssessment(Request $request, Lesson $lesson): LessonResource|JsonResponse
    {
        if (!$lesson->is_assessment) {
            return response()->json(['message' => 'This endpoint is for assessment lessons only.'], 422);
        }

        $validated = $request->validate([
            'level_id'          => ['sometimes', 'integer', 'exists:levels,id'],
            'title'             => ['sometimes', 'string', 'max:200'],
            'description'       => ['sometimes', 'nullable', 'string'],
            'nearpod_lesson_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'nearpod_url'       => ['sometimes', 'nullable', 'url', 'max:500'],
            'is_active'         => ['sometimes', 'boolean'],
        ]);

        $lesson->update($validated);

        return new LessonResource($lesson->fresh()->load('level'));
    }
}
