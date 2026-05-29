<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\SessionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public Evaluation Booking — Student app books a free assessment session.
 *
 * Flow:
 *   1. Find existing lead by phone (including soft-deleted → restore).
 *   2. If not found: create a new lead.
 *   3. Block if lead already has an active future demo booking.
 *   4. Create a SessionRequest (type=demo, status=pending) linked to the lead.
 *
 * The booking then appears inside the lead's profile under Trial Bookings
 * in the CRM — not as a separate new lead.
 */
class EvalBookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'phone'        => ['required', 'string', 'max:30'],
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        // ── 1. Find or create lead ─────────────────────────────────────────────
        $lead = Lead::withTrashed()->where('phone', $validated['phone'])->first();

        if ($lead) {
            if ($lead->trashed()) {
                $lead->restore();
            }
            // Keep existing status / assignment — just update name if it changed
            $lead->update(['name' => $validated['name']]);
        } else {
            $lead = Lead::create([
                'name'   => $validated['name'],
                'phone'  => $validated['phone'],
                'source' => 'app_eval',
                'status' => Lead::STATUS_NEW,
            ]);
        }

        // ── 2. Block duplicate active booking ─────────────────────────────────
        $existing = SessionRequest::where('lead_id', $lead->id)
            ->where('type', SessionRequest::TYPE_DEMO)
            ->whereIn('status', [
                SessionRequest::STATUS_PENDING,
                SessionRequest::STATUS_CONFIRMED,
            ])
            ->where('requested_at_utc', '>', now())
            ->first();

        if ($existing) {
            return response()->json([
                'message'      => 'لديك حجز نشط بالفعل. سيتواصل معك فريقنا لتأكيد موعدك.',
                'scheduled_at' => $existing->requested_at_utc->toIso8601String(),
            ], 409);
        }

        // ── 3. Create the demo booking ────────────────────────────────────────
        SessionRequest::create([
            'type'             => SessionRequest::TYPE_DEMO,
            'lead_id'          => $lead->id,
            'requested_at_utc' => $validated['scheduled_at'],
            'status'           => SessionRequest::STATUS_PENDING,
        ]);

        return response()->json([
            'message' => 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً لتأكيد موعد حصتك التقييمية.',
        ], 201);
    }

    /**
     * Check whether the given phone has an active (non-cancelled) future booking.
     *
     * GET /api/v1/public/eval-booking/status?phone=…
     *
     * Used by the student app on modal open so a booking cancelled by the CRM
     * is reflected immediately — instead of relying on the local SecureStore cache.
     */
    public function status(Request $request): JsonResponse
    {
        $request->validate(['phone' => ['required', 'string', 'max:30']]);

        $lead = Lead::where('phone', $request->phone)->first();

        if (!$lead) {
            return response()->json(['has_active_booking' => false]);
        }

        $booking = SessionRequest::where('lead_id', $lead->id)
            ->where('type', SessionRequest::TYPE_DEMO)
            ->whereIn('status', [
                SessionRequest::STATUS_PENDING,
                SessionRequest::STATUS_CONFIRMED,
            ])
            ->where('requested_at_utc', '>', now())
            ->first();

        if (!$booking) {
            return response()->json(['has_active_booking' => false]);
        }

        return response()->json([
            'has_active_booking' => true,
            'scheduled_at'       => $booking->requested_at_utc->toIso8601String(),
        ]);
    }
}
