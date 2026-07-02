<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\SessionRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public Booking — Landing page visitors book a free assessment session.
 *
 * Flow:
 *   1. Find existing lead by phone (don't create a duplicate).
 *   2. If not found: create a new lead.
 *   3. Create a SessionRequest (type=demo, status=pending) so the booking
 *      appears inside the lead's profile under Trial Bookings in the CRM.
 */
class BookingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:100'],
            'phone'          => ['required', 'string', 'max:30'],
            'preferred_date' => ['required', 'in:today,tomorrow'],
            'preferred_hour' => ['required', 'integer', 'min:0', 'max:23'],
            // level is a soft hint for the CC — never reject a public lead over it.
            // Optional + free string (the shared BookingPayload type marks it `level?`).
            'level'          => ['nullable', 'string', 'max:50'],
            'message'        => ['nullable', 'string', 'max:500'],
        ]);

        // ── 1. Find or create lead ─────────────────────────────────────────────
        $lead = Lead::withTrashed()->where('phone', $validated['phone'])->first();

        if ($lead) {
            if ($lead->trashed()) {
                $lead->restore();
            }
            // Existing lead: keep their status/assignment, just update name
            $lead->update(['name' => $validated['name']]);
        } else {
            // Check if phone matches a Small Treasury lead for auto-assignment
            $smallTreasure = Lead::where('phone', $validated['phone'])
                ->where('is_small_treasure', true)
                ->whereNotNull('assigned_to')
                ->first();

            $lead = Lead::create([
                'name'        => $validated['name'],
                'phone'       => $validated['phone'],
                'source'      => 'landing_page',
                'status'      => Lead::STATUS_NEW,
                'assigned_to' => $smallTreasure?->assigned_to,
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
                'message'   => 'لديك طلب حجز سابق. سيتواصل معك فريقنا قريباً.',
                'duplicate' => true,
            ], 409);
        }

        // ── 3. Build scheduled datetime from preferred_date + preferred_hour ──
        // NOTE: don't use Carbon's ->when() here — it only exists on newer Carbon
        // versions (Conditionable trait) and throws UnknownMethodException on older
        // ones. Plain if is version-independent.
        $scheduledAt = Carbon::now();
        if ($validated['preferred_date'] === 'tomorrow') {
            $scheduledAt->addDay();
        }
        $scheduledAt->setHour((int) $validated['preferred_hour'])
            ->setMinute(0)
            ->setSecond(0);

        // ── 4. Create demo booking (Trial Booking in CRM) ──────────────────────
        SessionRequest::create([
            'type'             => SessionRequest::TYPE_DEMO,
            'lead_id'          => $lead->id,
            'requested_at_utc' => $scheduledAt,
            'status'           => SessionRequest::STATUS_PENDING,
        ]);

        // ── 5. Attach booking details as a remark on the lead ─────────────────
        $hour   = (int) $validated['preferred_hour'];
        $h      = $hour === 0 ? 12 : ($hour > 12 ? $hour - 12 : $hour);
        $period = $hour < 12 ? 'ص' : 'م';
        $dateAr = $validated['preferred_date'] === 'today' ? 'اليوم' : 'غداً';

        $levelNames = [
            'beginner'     => 'مبتدئ (A1–A2)',
            'elementary'   => 'أساسي (B1)',
            'intermediate' => 'متوسط (B2)',
            'advanced'     => 'متقدم (C1–C2)',
        ];

        $levelInput = $validated['level'] ?? null;
        $levelLabel = $levelInput ? ($levelNames[$levelInput] ?? $levelInput) : 'غير محدد';

        $parts = [
            '📋 طلب حجز من الصفحة الرئيسية',
            "📅 الوقت المفضل: {$dateAr} — {$h}:00 {$period}",
            '📊 المستوى: ' . $levelLabel,
        ];

        if (!empty($validated['message'])) {
            $parts[] = '💬 ملاحظات: ' . $validated['message'];
        }

        $lead->remarks()->create([
            'content'  => implode("\n", $parts),
            'staff_id' => null,
        ]);

        return response()->json([
            'message' => 'تم استلام طلبك بنجاح. سيتواصل معك مستشارنا التعليمي قريباً.',
        ], 201);
    }
}
