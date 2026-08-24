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
        if (! $this->ownsSession($session, $student)) {
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

        if (! $this->ownsSession($session, $student)) {
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

    // ─── Ownership ────────────────────────────────────────────────────────────

    /** Last 9 digits of a phone (format-agnostic), or null if too short. */
    private function phoneLast9(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        return strlen($digits) >= 8 ? substr($digits, -9) : null;
    }

    /**
     * The session is theirs if they are its student, or it is a trial booked for
     * their lead (student_id null, matched by phone) — mirrors SessionController.
     */
    private function ownsSession(Session $session, $user): bool
    {
        if ($session->student_id !== null && (int) $session->student_id === (int) $user->id) {
            return true;
        }

        $last9 = $this->phoneLast9($user->phone);

        if ($last9 && $session->lead) {
            $leadDigits = preg_replace('/\D/', '', (string) $session->lead->phone);

            return strlen($leadDigits) >= 8 && substr($leadDigits, -9) === $last9;
        }

        return false;
    }
}
