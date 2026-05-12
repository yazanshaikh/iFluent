<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherEarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EarningsController extends Controller
{
    // ─── All Teacher Balances ─────────────────────────────────────────────────

    public function balances(): JsonResponse
    {
        $teachers = Teacher::with('user:id,name,email')
            ->orderByDesc('balance')
            ->get();

        return response()->json([
            'teachers' => $teachers->map(fn($t) => [
                'teacher_id'      => $t->id,
                'teacher_code'    => $t->teacher_code,
                'name'            => $t->user?->name,
                'email'           => $t->user?->email,
                'commission_rate' => $t->commission_rate,
                'balance'         => $t->balance,
            ]),
        ]);
    }

    // ─── Teacher Earning History (by teacher) ─────────────────────────────────

    public function history(int $id): JsonResponse
    {
        $teacher = Teacher::with('user:id,name')->findOrFail($id);

        $earnings = TeacherEarning::forTeacher($teacher->user_id)
            ->with(['session:id,status,started_at,ended_at'])
            ->orderByDesc('credited_at')
            ->paginate(30);

        return response()->json([
            'teacher' => [
                'id'      => $teacher->id,
                'name'    => $teacher->user?->name,
                'balance' => $teacher->balance,
            ],
            'earnings' => $earnings->through(fn($e) => [
                'id'           => $e->id,
                'amount'       => $e->amount,
                'session_type' => $e->session_type,
                'credited_at'  => $e->credited_at?->toIso8601String(),
            ]),
        ]);
    }

    // ─── Update Commission Rate ───────────────────────────────────────────────

    public function updateRate(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:9999.99'],
        ]);

        $teacher = Teacher::findOrFail($id);
        $teacher->update(['commission_rate' => $validated['commission_rate']]);

        return response()->json([
            'message'         => 'Commission rate updated.',
            'commission_rate' => $teacher->commission_rate,
        ]);
    }
}
