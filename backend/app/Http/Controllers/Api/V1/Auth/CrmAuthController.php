<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\CrmLoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class CrmAuthController extends Controller
{
    /**
     * Login for CRM users: super_admin, cc, ss, teacher.
     * Returns a Sanctum token scoped to the user's role.
     */
    public function login(CrmLoginRequest $request): JsonResponse
    {
        // Use withTrashed so we can detect deactivated accounts explicitly
        $user = User::withTrashed()->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Deactivated staff: give a clear message instead of "invalid credentials"
        if ($user->trashed()) {
            return response()->json([
                'message' => 'Your account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        if (!$user->isCrmUser()) {
            return response()->json([
                'message' => 'Access denied. This login is for CRM users only.',
            ], 403);
        }

        // Revoke previous tokens for this device (single-session per user)
        $user->tokens()->delete();

        $token = $user->createToken(
            name: 'crm-session',
            abilities: [$user->role],
        )->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'   => $user->id,
                'name' => $user->name,
                'email'=> $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        request()->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(): JsonResponse
    {
        $user = request()->user();

        return response()->json([
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'role'     => $user->role,
            'timezone' => $user->timezone,
        ]);
    }
}
