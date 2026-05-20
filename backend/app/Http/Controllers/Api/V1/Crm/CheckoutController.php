<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Crm\CheckoutRequest;
use App\Models\Lead;
use App\Models\PaymentAccount;
use App\Models\Student;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    /**
     * Generate a payment invoice for a lead.
     * Picks the next payment account via global round-robin.
     * Status starts as pending_screenshot until receipt is uploaded.
     */
    public function store(CheckoutRequest $request, Lead $lead): JsonResponse
    {
        $this->authorize('activate-subscription');

        if ($request->user()->isCC() && $lead->assigned_to !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        // Prevent duplicate open invoices for the same lead
        if ($lead->student?->subscriptions()
            ->whereIn('status', [
                Subscription::STATUS_PENDING_SCREENSHOT,
                Subscription::STATUS_PENDING,
            ])->exists()) {
            return response()->json([
                'message' => 'هذا الطالب لديه فاتورة مفتوحة بالفعل.',
            ], 422);
        }

        $paymentAccount = PaymentAccount::nextInRotation();
        $invoiceUuid    = (string) Str::uuid();

        $subscription = DB::transaction(function () use ($request, $lead, $paymentAccount, $invoiceUuid) {
            $student = $this->ensureStudentExists($lead);

            return Subscription::create([
                'invoice_uuid'       => $invoiceUuid,
                'student_id'         => $student->id,
                'payment_account_id' => $paymentAccount->id,
                'activated_by'       => $request->user()->id,
                'status'             => Subscription::STATUS_PENDING_SCREENSHOT,
                'months_count'       => $request->months_count,
                'amount_paid'        => $request->amount_paid,
            ]);
        });

        return response()->json([
            'invoice_uuid'    => $invoiceUuid,
            'invoice_url'     => "/pay/{$invoiceUuid}",
            'payment_account' => [
                'alias'     => $paymentAccount->alias,
                'cliq_name' => $paymentAccount->cliq_name,
            ],
            'months_count' => $subscription->months_count,
            'amount_paid'  => $subscription->amount_paid,
        ], 201);
    }

    private function ensureStudentExists(Lead $lead): Student
    {
        if ($lead->student) {
            return $lead->student;
        }

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
