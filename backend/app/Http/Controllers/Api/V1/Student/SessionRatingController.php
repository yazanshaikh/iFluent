<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionRating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Student rates the teacher after each completed session.
 *
 * Screen appears once when session status = completed.
 * Rating: 1–5 stars (required) + optional text notes.
 * Student can only rate their own sessions.
 * One rating per session (enforced by DB unique constraint).
 */
class SessionRatingController extends Controller
{
    // ─── Submit Rating ────────────────────────────────────────────────────────

    public function store(Session $session, Request $request): JsonResponse
    {
        $student = $request->user();

        // Only the session's student can rate
        if ($session->student_id !== $student->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Can only rate completed sessions
        if (!$session->isCompleted()) {
            return response()->json([
                'message' => 'You can only rate completed sessions.',
            ], 422);
        }

        // Already rated?
        if (SessionRating::where('session_id', $session->id)->exists()) {
            return response()->json([
                'message' => 'You have already rated this session.',
            ], 422);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'notes'  => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $rating = SessionRating::create([
            'session_id' => $session->id,
            'student_id' => $student->id,
            'teacher_id' => $session->teacher_id,
            'rating'     => $validated['rating'],
            'notes'      => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Thank you for your feedback!',
            'rating'  => [
                'id'         => $rating->id,
                'rating'     => $rating->rating,
                'notes'      => $rating->notes,
                'session_id' => $rating->session_id,
            ],
        ], 201);
    }

    // ─── Check if Session Has Been Rated ─────────────────────────────────────

    /**
     * Mobile app calls this when landing on the post-session screen
     * to know whether to show the rating form or skip it.
     */
    public function check(Session $session, Request $request): JsonResponse
    {
        $student = $request->user();

        if ($session->student_id !== $student->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $existing = SessionRating::where('session_id', $session->id)->first();

        return response()->json([
            'rated'  => $existing !== null,
            'rating' => $existing ? [
                'rating' => $existing->rating,
                'notes'  => $existing->notes,
            ] : null,
        ]);
    }
}
