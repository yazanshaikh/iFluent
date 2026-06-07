<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TeacherAuthController extends Controller
{
    /**
     * POST /api/v1/teacher/auth/login
     * Teacher logs in with email + password.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::withTrashed()->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'], 401);
        }

        if ($user->trashed()) {
            return response()->json(['message' => 'الحساب معطّل. تواصل مع الإدارة.'], 403);
        }

        if (!$user->isTeacher()) {
            return response()->json(['message' => 'هذا الحساب ليس حساب معلم.'], 403);
        }

        // Single session — revoke previous tokens
        $user->tokens()->delete();

        $token   = $user->createToken('teacher-session', ['teacher'])->plainTextToken;
        $teacher = Teacher::where('user_id', $user->id)->first();

        $avgRating = $teacher
            ? round(\DB::table('session_ratings')->where('teacher_id', $user->id)->avg('rating') ?? 0, 1)
            : null;

        return response()->json([
            'token' => $token,
            'user'  => $this->buildUserResponse($user, $teacher, $avgRating),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user      = $request->user();
        $teacher   = Teacher::where('user_id', $user->id)->first();
        $avgRating = $teacher
            ? round(\DB::table('session_ratings')->where('teacher_id', $user->id)->avg('rating') ?? 0, 1)
            : null;

        return response()->json($this->buildUserResponse($user, $teacher, $avgRating));
    }

    private function buildUserResponse($user, $teacher, $avgRating): array
    {
        $commissionRate = (float) ($teacher?->commission_rate ?? 0);

        if (!$teacher) {
            return [
                'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
                'role' => $user->role, 'teacher_code' => null,
                'balance' => 0, 'commission_rate' => 0,
                'avg_rating' => null, 'sessions_count' => 0, 'absences_count' => 0,
            ];
        }

        $baseAll = \DB::table('sessions')
            ->where('teacher_id', $user->id)
            ->where('status', 'completed');

        // sessions_count: since last sessions reset
        $baseSessions = (clone $baseAll);
        if ($teacher->sessions_count_reset_at) {
            $baseSessions->where('ended_at', '>', $teacher->sessions_count_reset_at);
        }
        $sessionsCount = (clone $baseSessions)->where('attendance_status', 'attended')->count();

        // absences_count: since last absences reset
        $baseAbsences = (clone $baseAll);
        if ($teacher->absences_reset_at) {
            $baseAbsences->where('ended_at', '>', $teacher->absences_reset_at);
        }
        $absencesCount = (clone $baseAbsences)->where('attendance_status', 'teacher_absent')->count();

        // balance: sessions since last balance reset × commission_rate
        $baseBalance = (clone $baseAll)->where('attendance_status', 'attended');
        if ($teacher->balance_reset_at) {
            $baseBalance->where('ended_at', '>', $teacher->balance_reset_at);
        }
        $balance = (clone $baseBalance)->count() * $commissionRate;

        return [
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'role'            => $user->role,
            'teacher_code'    => $teacher?->teacher_code,
            'balance'         => $balance,
            'commission_rate' => $commissionRate,
            'avg_rating'      => $avgRating ?: null,
            'sessions_count'  => $sessionsCount,
            'absences_count'  => $absencesCount,
        ];
    }
}
