<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public (unauthenticated) lead capture.
 * Called from the student app welcome / eval booking screens.
 */
class LeadController extends Controller
{
    /**
     * Store or update a lead from the app.
     *
     * POST /api/v1/public/leads
     * Body: { name, phone, scheduled_at? }
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
        ]);

        $source = $validated['scheduled_at'] ?? null ? 'app_eval' : 'app';

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
            Lead::create([
                'name'         => $validated['name'],
                'phone'        => $validated['phone'],
                'source'       => $source,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
                'status'       => Lead::STATUS_NEW,
            ]);
        }

        return response()->json([
            'message' => 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.',
        ], 201);
    }
}
