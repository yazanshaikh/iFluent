<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * GET /public/invoice/{uuid}
     * Public endpoint — no auth required.
     * Shows invoice details to the customer for payment.
     */
    public function show(string $uuid): JsonResponse
    {
        $subscription = Subscription::where('invoice_uuid', $uuid)
            ->with(['paymentAccount', 'student.user'])
            ->firstOrFail();

        return response()->json([
            'invoice_uuid'    => $subscription->invoice_uuid,
            'student_name'    => $subscription->student->user->name,
            'months_count'    => $subscription->months_count,
            'amount_due'      => (float) $subscription->amount_paid,
            'status'          => $subscription->status,
            'payment_account' => [
                'alias'     => $subscription->paymentAccount?->alias,
                'cliq_name' => $subscription->paymentAccount?->cliq_name,
            ],
            'created_at' => $subscription->created_at->toIso8601String(),
        ]);
    }

    /**
     * POST /public/invoice/{uuid}/receipt
     * Customer uploads their payment receipt screenshot.
     * Transitions: pending_screenshot → pending_approval.
     */
    public function uploadReceipt(Request $request, string $uuid): JsonResponse
    {
        $subscription = Subscription::where('invoice_uuid', $uuid)
            ->where('status', Subscription::STATUS_PENDING_SCREENSHOT)
            ->firstOrFail();

        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $path = $request->file('receipt')->store('payments/screenshots', 'private');

        $subscription->update([
            'payment_screenshot' => $path,
            'status'             => Subscription::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => 'تم رفع الوصل بنجاح. سيتم مراجعته من قبل الإدارة.',
        ]);
    }
}
