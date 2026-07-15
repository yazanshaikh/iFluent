<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public (unauthenticated) lead capture.
 * Called from the student app welcome / eval booking screens and the
 * landing page /register form.
 */
class LeadController extends Controller
{
    /**
     * Store or update a lead from the app.
     *
     * POST /api/v1/public/leads
     * Body: { name, phone, scheduled_at?, stage? }
     *
     * Uses upsert on phone so re-submissions (e.g. student books eval)
     * update the same record rather than failing the unique constraint.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'phone'        => ['required', 'string', 'max:30'],
            'scheduled_at' => ['nullable', 'date'],
            // المرحلة الدراسية — sent by the landing /register page only.
            'stage'        => ['nullable', 'string', 'in:ابتدائي,اعدادي,ثانوي,توجيهي,جامعة,منتهي من الدراسة'],
        ]);

        $stage  = $validated['stage'] ?? null;
        $source = $stage
            ? 'landing_register'
            : (($validated['scheduled_at'] ?? null) ? 'app_eval' : 'app');

        // Find existing lead (including soft-deleted) to avoid unique-phone clash
        $lead = Lead::withTrashed()->where('phone', $validated['phone'])->first();

        if ($lead) {
            if ($lead->trashed()) {
                $lead->restore();
            }
            $lead->update([
                'name'         => $validated['name'],
                'source'       => $source,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
            ]);
        } else {
            $lead = Lead::create([
                'name'         => $validated['name'],
                'phone'        => $validated['phone'],
                'source'       => $source,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
                'status'       => Lead::STATUS_NEW,
            ]);
        }

        // Keep the stage visible to the CC inside the lead profile as a system
        // remark (staff_id null — authorless remarks are supported).
        if ($stage) {
            $lead->remarks()->create([
                'content'  => "📋 تسجيل من صفحة (سجّل الآن)\n🎓 المرحلة الدراسية: {$stage}",
                'staff_id' => null,
            ]);
        }

        return response()->json([
            'message' => 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.',
        ], 201);
    }
}
