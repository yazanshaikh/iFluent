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

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'teacher_code'    => $teacher?->teacher_code,
                'balance'         => (float) ($teacher?->balance ?? 0),
                'commission_rate' => (float) ($teacher?->commission_rate ?? 0),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user    = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        return response()->json([
            'id'              => $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'role'            => $user->role,
            'teacher_code'    => $teacher?->teacher_code,
            'balance'         => (float) ($teacher?->balance ?? 0),
            'commission_rate' => (float) ($teacher?->commission_rate ?? 0),
        ]);
    }
}
