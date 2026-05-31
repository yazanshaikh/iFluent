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

            $lessonsCount = $request->lessons_count;
            $monthsCount  = (int) ceil($lessonsCount / 12); // for subscription duration

            return Subscription::create([
                'invoice_uuid'       => $invoiceUuid,
                'student_id'         => $student->id,
                'payment_account_id' => $paymentAccount->id,
                'activated_by'       => $request->user()->id,
                'status'             => Subscription::STATUS_PENDING_SCREENSHOT,
                'lessons_count'      => $lessonsCount,
                'months_count'       => $monthsCount,
                'amount_paid'        => $request->amount_paid,
                // Lesson range — selected by employee at purchase time
                'from_lesson_id'     => $request->from_lesson_id,
                'to_lesson_id'       => $request->to_lesson_id,
            ]);
        });

        return response()->json([
            'invoice_uuid'    => $invoiceUuid,
            'invoice_url'     => "/pay/{$invoiceUuid}",
            'payment_account' => [
                'alias'     => $paymentAccount->alias,
                'cliq_name' => $paymentAccount->cliq_name,
            ],
            'lessons_count' => $subscription->lessons_count,
            'months_count'  => $subscription->months_count,
            'amount_paid'   => $subscription->amount_paid,
        ], 201);
    }

    /**
     * POST /crm/process-orders/{subscription}/cancel
     * Cancel a subscription that is still pending_screenshot (before receipt uploaded).
     * Only the employee who created it (or admin) can cancel.
     */
    public function cancel(Subscription $subscription, \Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        if ($subscription->status !== Subscription::STATUS_PENDING_SCREENSHOT) {
            return response()->json(['message' => 'يمكن إلغاء الفاتورة فقط قبل رفع وصل الدفع.'], 422);
        }

        // CC/SS can only cancel their own invoices
        if (($user->isCC() || $user->isSS()) && $subscription->activated_by !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $subscription->update(['status' => Subscription::STATUS_CANCELLED]);

        return response()->json(['message' => 'تم إلغاء الفاتورة بنجاح.']);
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
