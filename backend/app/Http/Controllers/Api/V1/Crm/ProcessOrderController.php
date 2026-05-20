<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SubscriptionResource;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ProcessOrderController extends Controller
{
    /**
     * GET /crm/process-orders
     * Each employee sees only their own pending_screenshot invoices.
     * Admin sees all.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $subscriptions = Subscription::where('status', Subscription::STATUS_PENDING_SCREENSHOT)
            ->where('activated_by', $request->user()->id)
            ->with(['student.user', 'paymentAccount', 'activatedBy'])
            ->latest()
            ->paginate(25);

        return SubscriptionResource::collection($subscriptions);
    }

    /**
     * POST /crm/process-orders/{subscription}/upload-receipt
     * Staff uploads receipt on behalf of the customer.
     * Transitions: pending_screenshot → pending_approval.
     */
    public function uploadReceipt(Request $request, Subscription $subscription): SubscriptionResource|JsonResponse
    {
        if (!$subscription->isPendingScreenshot()) {
            return response()->json([
                'message' => 'هذه الفاتورة ليست بحالة انتظار الوصل.',
            ], 422);
        }

        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $path = $request->file('receipt')->store('payments/screenshots', 'private');

        $subscription->update([
            'payment_screenshot' => $path,
            'status'             => Subscription::STATUS_PENDING,
        ]);

        return new SubscriptionResource(
            $subscription->fresh()->load(['student.user', 'paymentAccount', 'activatedBy'])
        );
    }
}
