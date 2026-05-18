<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public Booking — Landing page visitors book a free assessment session.
 * No authentication required.
 * Creates a Lead record (source = landing_page) + a LeadRemark with details.
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
            'level'          => ['required', 'in:beginner,elementary,intermediate,advanced'],
            'message'        => ['nullable', 'string', 'max:500'],
        ]);

        // ── Server-side duplicate check (same phone, still active) ────────────
        $existing = Lead::where('phone', $validated['phone'])
            ->whereIn('status', [Lead::STATUS_NEW, Lead::STATUS_IN_PROGRESS])
            ->first();

        if ($existing) {
            return response()->json([
                'message'   => 'لديك طلب حجز سابق. سيتواصل معك فريقنا قريباً.',
                'duplicate' => true,
            ], 409);
        }

        // Check if phone matches a Small Treasury lead — assign to that employee
        $existingSmallTreasure = Lead::where('phone', $validated['phone'])
            ->where('is_small_treasure', true)
            ->whereNotNull('assigned_to')
            ->first();

        // ── Create Lead ───────────────────────────────────────────────────────
        $lead = Lead::create([
            'name'        => $validated['name'],
            'phone'       => $validated['phone'],
            'source'      => 'landing_page',
            'status'      => Lead::STATUS_NEW,
            'assigned_to' => $existingSmallTreasure?->assigned_to,
        ]);

        // ── Attach booking detail as a remark ─────────────────────────────────
        $hour    = (int) $validated['preferred_hour'];
        $h       = $hour === 0 ? 12 : ($hour > 12 ? $hour - 12 : $hour);
        $period  = $hour < 12 ? 'ص' : 'م';
        $dateAr  = $validated['preferred_date'] === 'today' ? 'اليوم' : 'غداً';

        $levelNames = [
            'beginner'     => 'مبتدئ (A1–A2)',
            'elementary'   => 'أساسي (B1)',
            'intermediate' => 'متوسط (B2)',
            'advanced'     => 'متقدم (C1–C2)',
        ];

        $parts = [
            '📋 طلب حجز من الصفحة الرئيسية',
            "📅 الوقت المفضل: {$dateAr} — {$h}:00 {$period}",
            '📊 المستوى: ' . ($levelNames[$validated['level']] ?? $validated['level']),
        ];

        if (!empty($validated['message'])) {
            $parts[] = '💬 ملاحظات: ' . $validated['message'];
        }

        $lead->remarks()->create([
            'content'  => implode("\n", $parts),
            'staff_id' => null,   // system remark, no staff author
        ]);

        return response()->json([
            'message' => 'تم استلام طلبك بنجاح. سيتواصل معك مستشارنا التعليمي قريباً.',
        ], 201);
    }
}
