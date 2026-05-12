<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Crm\CheckoutRequest;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Lead;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    /**
     * CC submits payment proof for a lead.
     * Creates a student account placeholder + pending subscription.
     * Levels stay LOCKED until admin approves.  (PRD 5.4.4 / 5.4.5)
     */
    public function store(CheckoutRequest $request, Lead $lead): SubscriptionResource|JsonResponse
    {
        $this->authorize('activate-subscription');

        // CC can only checkout their own lead
        if ($request->user()->isCC() && $lead->assigned_to !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Prevent duplicate pending subscriptions for same lead
        if ($lead->student?->subscriptions()->where('status', Subscription::STATUS_PENDING)->exists()) {
            return response()->json([
                'message' => 'This lead already has a pending subscription awaiting approval.',
            ], 422);
        }

        $screenshotPath = $request->file('payment_screenshot')
            ->store('payments/screenshots', 'private');

        $subscription = DB::transaction(function () use ($request, $lead, $screenshotPath) {

            // Ensure student account exists (shell account, levels locked until approval)
            $student = $this->ensureStudentExists($lead);

            return Subscription::create([
                'student_id'         => $student->id,
                'package_id'         => $request->package_id,
                'activated_by'       => $request->user()->id,
                'status'             => Subscription::STATUS_PENDING,
                'amount_paid'        => $request->amount_paid,
                'payment_method'     => $request->payment_method,
                'payment_reference'  => $request->payment_reference,
                'payment_screenshot' => $screenshotPath,
            ]);
        });

        return new SubscriptionResource(
            $subscription->load(['package', 'student.user', 'activatedBy'])
        );
    }

    /**
     * Creates a locked student account from the lead if one doesn't exist yet.
     */
    private function ensureStudentExists(Lead $lead): \App\Models\Student
    {
        if ($lead->student) {
            return $lead->student;
        }

        // Create a shell user (no password — student will login via OTP)
        $user = User::firstOrCreate(
            ['phone' => $lead->phone],
            [
                'name'     => $lead->name,
                'role'     => User::ROLE_STUDENT,
                'timezone' => 'Asia/Amman',
            ]
        );

        return Student::firstOrCreate(
            ['user_id' => $user->id],
            ['lead_id' => $lead->id]
        );
    }
}
