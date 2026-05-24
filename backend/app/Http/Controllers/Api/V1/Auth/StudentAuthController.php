<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\SendOtpRequest;
use App\Http\Requests\Api\V1\Auth\VerifyOtpRequest;
use App\Models\Lead;
use App\Models\OtpCode;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StudentAuthController extends Controller
{
    // =========================================================================
    // Firebase Phone Auth flow  (production)
    // =========================================================================

    /**
     * Step 1-A: Check if a phone number belongs to a registered student.
     *
     * POST /api/v1/auth/check-phone
     * Body: { phone: string }
     * Response:
     *   200 { exists: true }   — phone is in the system → Frontend triggers Firebase OTP
     *   200 { exists: false }  — phone not found        → Frontend shows "register first" message
     */
    public function checkPhone(Request $request): JsonResponse
    {
        $request->validate(['phone' => ['required', 'string', 'max:20']]);

        $exists = User::where('phone', $request->phone)
            ->where('role', User::ROLE_STUDENT)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    /**
     * Step 1-B: Self-registration — create a Lead record for a new student.
     *
     * POST /api/v1/auth/register
     * Body: { name: string, phone: string }
     * Response:
     *   201 { message: 'Registered successfully.' }
     *   422 if phone already registered
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
        ]);

        DB::transaction(function () use ($data) {
            // Create or update Lead record in CRM
            $lead = Lead::firstOrCreate(
                ['phone' => $data['phone']],
                ['name'  => $data['name']],
            );

            // Create User + Student so they can log in immediately
            $user = User::create([
                'name'  => $data['name'],
                'phone' => $data['phone'],
                'role'  => User::ROLE_STUDENT,
            ]);

            Student::create([
                'user_id' => $user->id,
                'lead_id' => $lead->id,
            ]);
        });

        return response()->json(['message' => 'Registered successfully.'], 201);
    }

    /**
     * Step 3: Verify Firebase IdToken → issue Sanctum token.
     *
     * After Firebase confirms the OTP on the client, the app sends the IdToken
     * here. We verify it against Google's public keys (no SDK needed), then
     * create / retrieve the user and issue a Sanctum token.
     *
     * POST /api/v1/auth/firebase-verify
     * Body: { id_token: string }
     */
    public function firebaseVerify(Request $request): JsonResponse
    {
        $request->validate(['id_token' => ['required', 'string']]);

        $phone = $this->verifyFirebaseIdToken($request->id_token);

        if (! $phone) {
            return response()->json(['message' => 'Invalid or expired Firebase token.'], 401);
        }

        $user = DB::transaction(function () use ($phone) {
            $user = User::firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => 'Student',
                    'role' => User::ROLE_STUDENT,
                ]
            );

            if (! $user->student) {
                $lead = Lead::where('phone', $phone)->first();
                Student::create([
                    'user_id' => $user->id,
                    'lead_id' => $lead?->id,
                ]);

                if ($lead && $user->name === 'Student') {
                    $user->update(['name' => $lead->name]);
                }
            }

            return $user;
        });

        $user->tokens()->delete();

        $token = $user->createToken(
            name: 'student-session',
            abilities: ['student'],
        )->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'phone' => $user->phone,
                'role'  => $user->role,
            ],
        ]);
    }

    // =========================================================================
    // Legacy OTP flow  (local dev / fallback)
    // =========================================================================

    /**
     * Step 1: Send OTP to phone number (local dev — no real SMS).
     * In production this is replaced by Firebase Phone Auth on the client.
     */
    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->phone;

        OtpCode::where('phone', $phone)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::create([
            'phone'      => $phone,
            'code'       => $code,
            'expires_at' => now()->addMinutes(5),
        ]);

        Log::info("OTP for {$phone}: {$code}");

        $response = ['message' => 'OTP sent.'];

        if (app()->isLocal()) {
            $response['code'] = $code;
        }

        return response()->json($response);
    }

    /**
     * Step 2: Verify OTP → issue token (local dev fallback).
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $phone = $request->phone;

        $otp = OtpCode::where('phone', $phone)
            ->where('code', $request->code)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (! $otp || ! $otp->isValid()) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $otp->update(['used_at' => now()]);

        $user = DB::transaction(function () use ($phone, $request) {
            $user = User::firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => $request->name ?? 'Student',
                    'role' => User::ROLE_STUDENT,
                ]
            );

            if (! $user->student) {
                $lead = Lead::where('phone', $phone)->first();
                Student::create([
                    'user_id' => $user->id,
                    'lead_id' => $lead?->id,
                ]);

                if ($lead && $user->name === 'Student') {
                    $user->update(['name' => $lead->name]);
                }
            }

            return $user;
        });

        $user->tokens()->delete();

        $token = $user->createToken(
            name: 'student-session',
            abilities: ['student'],
        )->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'phone' => $user->phone,
                'role'  => $user->role,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        request()->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Verify a Firebase IdToken using Google's public keys.
     * Returns the phone number on success, null on failure.
     * No Firebase Admin SDK required — just HTTPS to Google's JWKS endpoint.
     */
    private function verifyFirebaseIdToken(string $idToken): ?string
    {
        try {
            // Decode header to get key ID
            $parts = explode('.', $idToken);
            if (count($parts) !== 3) {
                return null;
            }

            $header  = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
            $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

            if (! $header || ! $payload) {
                return null;
            }

            // Basic claims validation
            $projectId = config('services.firebase.project_id');
            $now       = time();

            if (
                ($payload['aud']  ?? null) !== $projectId             ||
                ($payload['iss']  ?? null) !== "https://securetoken.google.com/{$projectId}" ||
                ($payload['exp']  ?? 0)    <= $now                    ||
                ($payload['iat']  ?? 0)    >  $now + 300
            ) {
                Log::warning('Firebase token claims invalid', compact('payload'));
                return null;
            }

            // Fetch Google's public certs (cached by Laravel's HTTP client)
            $certsUrl = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
            $certs    = Http::get($certsUrl)->json();
            $kid      = $header['kid'] ?? null;

            if (! $kid || ! isset($certs[$kid])) {
                return null;
            }

            // Verify signature
            $publicKey = openssl_pkey_get_public($certs[$kid]);
            $data      = "{$parts[0]}.{$parts[1]}";
            $sig       = base64_decode(strtr($parts[2], '-_', '+/'));
            $verified  = openssl_verify($data, $sig, $publicKey, OPENSSL_ALGO_SHA256);

            if ($verified !== 1) {
                return null;
            }

            // Extract phone number from token
            return $payload['phone_number'] ?? null;

        } catch (\Throwable $e) {
            Log::error('Firebase token verification failed: ' . $e->getMessage());
            return null;
        }
    }
}
