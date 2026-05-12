<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SessionRating;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;

class RatingController extends Controller
{
    // ─── Teacher Ratings Summary ──────────────────────────────────────────────

    public function teacherSummary(): JsonResponse
    {
        $teachers = Teacher::with('user:id,name')
            ->where('is_active', true)
            ->get()
            ->map(function ($t) {
                $stats = SessionRating::forTeacher($t->user_id)
                    ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
                    ->first();

                return [
                    'teacher_code' => $t->teacher_code,
                    'name'         => $t->user?->name,
                    'avg_rating'   => $stats->avg_rating ? round((float) $stats->avg_rating, 1) : null,
                    'total_ratings'=> (int) $stats->total,
                ];
            });

        return response()->json(['teachers' => $teachers]);
    }

    // ─── Teacher Ratings Detail ───────────────────────────────────────────────

    public function teacherRatings(int $id): JsonResponse
    {
        $teacher = Teacher::with('user:id,name')->findOrFail($id);

        $ratings = SessionRating::forTeacher($teacher->user_id)
            ->with(['session:id,started_at,ended_at', 'student:id,name'])
            ->orderByDesc('created_at')
            ->paginate(30);

        $avg = SessionRating::forTeacher($teacher->user_id)->avg('rating');

        return response()->json([
            'teacher'    => ['name' => $teacher->user?->name, 'teacher_code' => $teacher->teacher_code],
            'avg_rating' => $avg ? round((float) $avg, 1) : null,
            'ratings'    => $ratings->through(fn($r) => [
                'id'         => $r->id,
                'rating'     => $r->rating,
                'notes'      => $r->notes,
                'student'    => $r->student?->name,
                'created_at' => $r->created_at->toIso8601String(),
            ]),
        ]);
    }
}
