<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Teacher manages their own profile:
 *   - Bio, specialization
 *   - Profile photo upload
 *   - FCM device token (for push notifications)
 *   - Timezone
 */
class ProfileController extends Controller
{
    // ─── Get Profile ──────────────────────────────────────────────────────────

    public function show(Request $request): JsonResponse
    {
        $user    = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->first();

        return response()->json([
            'profile' => [
                'name'            => $user->name,
                'email'           => $user->email,
                'teacher_code'    => $teacher?->teacher_code,
                'bio'             => $teacher?->bio,
                'specialization'  => $teacher?->specialization,
                'profile_photo'   => $teacher?->profile_photo
                    ? Storage::disk('public')->url($teacher->profile_photo)
                    : null,
                'commission_rate' => $teacher?->commission_rate,
                'balance'         => $teacher?->balance,
                'timezone'        => $user->timezone,
            ],
        ]);
    }

    // ─── Update Bio / Specialization ──────────────────────────────────────────

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bio'            => ['sometimes', 'nullable', 'string', 'max:1000'],
            'specialization' => ['sometimes', 'nullable', 'string', 'max:200'],
            'timezone'       => ['sometimes', 'string', 'timezone'],
        ]);

        $user = $request->user();

        if (isset($validated['timezone'])) {
            $user->update(['timezone' => $validated['timezone']]);
        }

        Teacher::where('user_id', $user->id)->update(
            array_filter([
                'bio'            => $validated['bio'] ?? null,
                'specialization' => $validated['specialization'] ?? null,
            ], fn($v) => $v !== null)
        );

        return response()->json(['message' => 'Profile updated.']);
    }

    // ─── Upload Profile Photo ─────────────────────────────────────────────────

    public function uploadPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'], // 3MB
        ]);

        $user    = $request->user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Delete old photo
        if ($teacher->profile_photo) {
            Storage::disk('public')->delete($teacher->profile_photo);
        }

        $path = $request->file('photo')->store("teachers/{$user->id}", 'public');
        $teacher->update(['profile_photo' => $path]);

        return response()->json([
            'message' => 'Profile photo updated.',
            'url'     => Storage::disk('public')->url($path),
        ]);
    }

    // ─── Update FCM Token ─────────────────────────────────────────────────────

    public function updateFcmToken(Request $request): JsonResponse
    {
        $request->validate(['fcm_token' => ['required', 'string']]);
        $request->user()->update(['fcm_token' => $request->fcm_token]);
        return response()->json(['message' => 'Device token registered.']);
    }
}
