<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\IapPurchase;
use App\Models\Lead;
use App\Models\Lesson;
use App\Models\SessionRequest;
use App\Models\Student;
use App\Services\AppleReceiptValidator;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Books an assessment session paid for with an in-app purchase (Apple StoreKit).
 *
 * The free path lives in BookingController; this one exists because the money
 * changes the trust model: the receipt is verified with Apple server-side, and
 * the transaction is recorded under a UNIQUE key so one payment can only ever
 * produce one booking.
 */
class PaidAssessmentController extends Controller
{
    public function __construct(private AppleReceiptValidator $apple) {}

    /**
     * POST /student/bookings/paid-assessment
     * Body: { receipt, scheduled_at, notes? }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receipt'      => ['required', 'string'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'notes'        => ['sometimes', 'nullable', 'string', 'max:300'],
        ]);

        $student   = $request->user();
        $productId = config('services.apple.assessment_product_id');

        // ── 1. Ask Apple whether this receipt is real ─────────────────────────
        try {
            $tx = $this->apple->validate($validated['receipt'], $productId);
        } catch (Throwable $e) {
            Log::warning('Paid assessment: receipt validation failed', [
                'user_id' => $student->id,
                'error'   => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'تعذّر التحقق من عملية الشراء. إذا خُصم المبلغ تواصل مع الدعم.',
            ], 422);
        }

        // ── 2. Claim the transaction, then create the booking ─────────────────
        try {
            $sessionRequest = DB::transaction(function () use ($student, $tx, $productId, $validated) {
                // The UNIQUE transaction_id is the replay guard: a second attempt
                // with the same receipt throws here and never reaches the booking.
                $purchase = IapPurchase::create([
                    'user_id'                 => $student->id,
                    'platform'                => 'ios',
                    'product_id'              => $productId,
                    'transaction_id'          => $tx['transaction_id'],
                    'original_transaction_id' => $tx['original_transaction_id'],
                    'purchased_at'            => $tx['purchased_at'] ? now()->setTimestamp($tx['purchased_at']) : now(),
                    'payload'                 => $tx['raw'],
                ]);

                $lesson = Lesson::defaultAssessment()->first();

                $sessionRequest = SessionRequest::create([
                    'type'             => SessionRequest::TYPE_DEMO,
                    'requested_by'     => $student->id,
                    'student_id'       => $student->id,
                    'lesson_id'        => $lesson?->id,
                    'requested_at_utc' => $validated['scheduled_at'],
                    'status'           => SessionRequest::STATUS_PENDING,
                    'note'             => $validated['notes'] ?? null,
                ]);

                $purchase->update(['session_request_id' => $sessionRequest->id]);

                $this->attachLead($student, $sessionRequest);

                return $sessionRequest;
            });
        } catch (QueryException $e) {
            // Unique violation → this receipt already bought a booking.
            if ($this->isUniqueViolation($e)) {
                return response()->json([
                    'message' => 'تم استخدام عملية الشراء هذه بالفعل لحجز حصة.',
                ], 409);
            }

            throw $e;
        }

        return response()->json([
            'message' => 'تم تأكيد الدفع وحجز حصتك التقييمية.',
            'request' => [
                'id'           => $sessionRequest->id,
                'status'       => $sessionRequest->status,
                'scheduled_at' => $sessionRequest->requested_at_utc->toIso8601String(),
                'lesson_id'    => $sessionRequest->lesson_id,
            ],
        ], 201);
    }

    /** Mirror the free flow: an assessment booking shows up as a CRM lead. */
    private function attachLead($student, SessionRequest $sessionRequest): void
    {
        $lead = Lead::findByPhoneFlexible($student->phone);

        if ($lead?->trashed()) {
            $lead->restore();
        }

        if (!$lead) {
            $lead = Lead::create([
                'name'   => $student->name,
                'phone'  => $student->phone,
                'source' => 'app_paid_assessment',
                'status' => Lead::STATUS_NEW,
            ]);
        }

        $sessionRequest->update(['lead_id' => $lead->id]);

        $profile = Student::where('user_id', $student->id)->first();

        if ($profile && !$profile->lead_id) {
            $profile->update(['lead_id' => $lead->id]);
        }
    }

    private function isUniqueViolation(QueryException $e): bool
    {
        return ($e->errorInfo[0] ?? null) === '23505'   // Postgres
            || ($e->errorInfo[1] ?? null) === 1062;     // MySQL
    }
}
