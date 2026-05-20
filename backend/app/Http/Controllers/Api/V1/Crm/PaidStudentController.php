<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaidStudentController extends Controller
{
    /**
     * GET /crm/paid-students
     * Admin → all converted leads.
     * CC/SS → only leads currently assigned to them (assigned_to = user->id).
     *
     * Filters: ?phone=&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&page=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'phone'     => ['nullable', 'string', 'max:20'],
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Lead::whereNotNull('converted_at')
            ->with([
                'assignedTo:id,name',
                'student.subscriptions' => fn($q) => $q
                    ->whereIn('status', [
                        Subscription::STATUS_ACTIVE,
                        Subscription::STATUS_PENDING,
                        Subscription::STATUS_EXPIRED,
                    ])
                    ->latest('activated_at'),
            ])
            ->latest('converted_at');

        // Non-admin sees only leads currently assigned to them
        if (!$request->user()->isSuperAdmin()) {
            $query->where('assigned_to', $request->user()->id);
        }

        if ($request->filled('phone')) {
            $query->where('phone', 'like', '%' . $request->phone . '%');
        }

        if ($request->filled('date_from')) {
            $query->whereDate('converted_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('converted_at', '<=', $request->date_to);
        }

        $leads = $query->paginate(20)->withQueryString();

        return response()->json([
            'data' => $leads->map(function (Lead $lead) {
                $sub = $lead->student?->subscriptions?->first();

                return [
                    'id'           => $lead->id,
                    'name'         => $lead->name,
                    'phone'        => $lead->phone,
                    'converted_at' => $lead->converted_at?->toIso8601String(),
                    'assigned_to'  => $lead->assignedTo
                        ? ['id' => $lead->assignedTo->id, 'name' => $lead->assignedTo->name]
                        : null,
                    'subscription' => $sub ? [
                        'id'             => $sub->id,
                        'amount_paid'    => (float) $sub->amount_paid,
                        'lessons_count'  => $sub->lessons_count,
                        'months_count'   => $sub->months_count,
                        'status'         => $sub->status,
                        'activated_at'   => $sub->activated_at?->toIso8601String(),
                        'expires_at'     => $sub->expires_at?->toIso8601String(),
                    ] : null,
                ];
            }),
            'meta' => [
                'current_page' => $leads->currentPage(),
                'last_page'    => $leads->lastPage(),
                'total'        => $leads->total(),
                'per_page'     => $leads->perPage(),
            ],
        ]);
    }
}
