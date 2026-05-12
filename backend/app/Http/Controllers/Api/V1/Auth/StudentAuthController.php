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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentAuthController extends Controller
{
    /**
     * Step 1: Send OTP to phone number.
     * In production, dispatch an SMS/WhatsApp job.
     * In development, the OTP is logged and returned in the response.
     */
    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $phone = $request->phone;

        // Invalidate any previous unused OTPs for this phone
        OtpCode::where('phone', $phone)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::create([
            'phone'      => $phone,
            'code'       => $code,
            'expires_at' => now()->addMinutes(5),
        ]);

        // TODO: replace with SMS/WhatsApp dispatch in production
        // SendOtpJob::dispatch($phone, $code);
        Log::info("OTP for {$phone}: {$code}");

        $response = ['message' => 'OTP sent.'];

        // Expose the code in local environment only
        if (app()->isLocal()) {
            $response['code'] = $code;
        }

        return response()->json($response);
    }

    /**
     * Step 2: Verify OTP → issue token.
     * Creates user + student record on first login.
     * Auto-links to existing CRM lead if phone matches.
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $phone = $request->phone;

        $otp = OtpCode::where('phone', $phone)
            ->where('code', $request->code)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$otp || !$otp->isValid()) {
            return response()->json([
                'message' => 'Invalid or expired OTP.',
            ], 422);
        }

        $otp->update(['used_at' => now()]);

        $user = DB::transaction(function () use ($phone, $request) {
            $isNew = !User::where('phone', $phone)->exists();

            $user = User::firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => $request->name ?? 'Student',
                    'role' => User::ROLE_STUDENT,
                ]
            );

            // Create student profile if it doesn't exist
            if (!$user->student) {
                $lead = Lead::where('phone', $phone)->first();

                Student::create([
                    'user_id' => $user->id,
                    'lead_id' => $lead?->id,
                ]);

                // Update lead name from CRM if student has no name yet
                if ($isNew && $lead && $user->name === 'Student') {
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
}
