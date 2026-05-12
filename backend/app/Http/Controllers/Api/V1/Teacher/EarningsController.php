<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherEarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EarningsController extends Controller
{
    // ─── Teacher Earnings History ─────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $teacher = $request->user();

        $earnings = TeacherEarning::forTeacher($teacher->id)
            ->with(['session:id,status,started_at,ended_at,student_id,lesson_id'])
            ->orderByDesc('credited_at')
            ->paginate(20);

        $profile = Teacher::where('user_id', $teacher->id)->first();

        return response()->json([
            'balance'  => $profile?->balance ?? 0,
            'earnings' => $earnings->through(fn($e) => [
                'id'           => $e->id,
                'amount'       => $e->amount,
                'session_type' => $e->session_type,
                'credited_at'  => $e->credited_at?->toIso8601String(),
                'session'      => $e->session ? [
                    'id'         => $e->session->id,
                    'started_at' => $e->session->started_at?->toIso8601String(),
                    'ended_at'   => $e->session->ended_at?->toIso8601String(),
                ] : null,
            ]),
        ]);
    }

    // ─── Admin: All Teacher Balances ──────────────────────────────────────────
    // NOTE: Admin version is in Admin\EarningsController — see admin routes
}
