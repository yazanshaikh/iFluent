<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Lesson;
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
    /**
     * Landing-form level → platform level code, so the trial gets that level's
     * assessment lesson (and therefore its activity). The form's labels carry
     * the mapping: مبتدئ A1–A2 / أساسي B1 / متوسط B2 / متقدم C1–C2.
     */
    private const LEVEL_TO_CODE = [
        'beginner'     => 'A1',
        'elementary'   => 'B1',
        'intermediate' => 'B2',
        'advanced'     => 'FT',
    ];

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
        // Flexible phone match (exact first, then last-9-digits) so a lead who
        // registered via /register with a differently formatted number gets the
        // booking attached to THEIR lead instead of spawning a duplicate.
        $lead = Lead::findByPhoneFlexible($validated['phone']);

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
        // preferred_hour is the JORDAN local hour the visitor picked (the landing
        // slots are 9…23 Amman time), so build the moment in Asia/Amman and only
        // then convert to UTC for storage in requested_at_utc. Building it with
        // the app timezone (UTC) stored 7 PM as 19:00 UTC, which the CRM then
        // rendered as 10 PM Amman (+3). Using Amman "today/tomorrow" also keeps
        // the date correct late at night, when the UTC date is still yesterday.
        //
        // NOTE: don't use Carbon's ->when() here — it only exists on newer Carbon
        // versions (Conditionable trait) and throws UnknownMethodException on older
        // ones. Plain if is version-independent.
        $scheduledAt = Carbon::now('Asia/Amman');
        if ($validated['preferred_date'] === 'tomorrow') {
            $scheduledAt->addDay();
        }
        $scheduledAt->setHour((int) $validated['preferred_hour'])
            ->setMinute(0)
            ->setSecond(0)
            ->setTimezone('UTC');

        // ── 4. Create demo booking (Trial Booking in CRM) ──────────────────────
        // Attach the assessment lesson MATCHING the level the visitor picked on
        // the landing form — so the teacher runs the right assessment and the
        // student gets that level's activity. Falls back to the lowest level when
        // no level was chosen (or that level has no assessment lesson yet).
        // Null-safe: stays null if no assessment lesson is seeded at all.
        $levelCode = self::LEVEL_TO_CODE[$validated['level'] ?? ''] ?? null;

        $assessmentLesson = $levelCode
            ? Lesson::assessmentForLevel($levelCode)->first()
            : null;

        $assessmentLessonId = ($assessmentLesson ?? Lesson::defaultAssessment()->first())?->id;

        SessionRequest::create([
            'type'             => SessionRequest::TYPE_DEMO,
            'lead_id'          => $lead->id,
            'lesson_id'        => $assessmentLessonId,
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
