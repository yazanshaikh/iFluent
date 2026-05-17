<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Crm\AssignLeadRequest;
use App\Http\Requests\Api\V1\Crm\StoreLeadRequest;
use App\Http\Requests\Api\V1\Crm\UpdateLeadRequest;
use App\Http\Resources\Api\V1\LeadResource;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LeadController extends Controller
{
    // ─── List Leads ───────────────────────────────────────────────────────────
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Lead::class);

        $query = Lead::withCount('remarks')
            ->with('assignedTo')
            ->latest();

        // CC sees only their own leads
        if ($request->user()->isCC()) {
            $query->where('assigned_to', $request->user()->id);
        }

        // Filters
        // status يقبل قيمة واحدة أو مصفوفة: ?status=in_process أو ?status[]=in_process&status[]=loss
        if ($request->filled('status')) {
            $statuses = is_array($request->status)
                ? $request->status
                : [$request->status];
            $query->whereIn('status', $statuses);
        }
        // unassigned=1 → فلتر بدون موظف (لعرض الـ pool غير المعيّن للمدير)
        if ($request->boolean('unassigned')) {
            $query->whereNull('assigned_to');
        }
        if ($request->has('is_small_treasure')) {
            $query->where('is_small_treasure', $request->boolean('is_small_treasure'));
        }
        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        return LeadResource::collection($query->paginate(20));
    }

    // ─── Create Lead ──────────────────────────────────────────────────────────
    public function store(StoreLeadRequest $request): LeadResource
    {
        $this->authorize('create', Lead::class);

        $actor = $request->user();

        // ── Determine assignment & status ──────────────────────────────────────
        // CC adds lead  → auto-assign to themselves → status: new (في قائمة الموظف)
        // Admin + assigned_to → assign to staff  → status: new (في قائمة الموظف)
        // Admin only → unassigned pool            → status: new (في قائمة المدير)

        if ($actor->isCC()) {
            $assignedTo = $actor->id;
            $status     = Lead::STATUS_NEW;
        } elseif ($actor->isSuperAdmin() && $request->filled('assigned_to')) {
            $target = User::find($request->assigned_to);
            if (!$target || !in_array($target->role, ['cc', 'ss'])) {
                return response()->json([
                    'message' => 'يمكن تعيين الليدات لموظفي CC أو SS فقط.',
                ], 422);
            }
            $assignedTo = $target->id;
            $status     = Lead::STATUS_NEW;
        } else {
            // Admin adds without specifying staff → unassigned pool
            $assignedTo = null;
            $status     = Lead::STATUS_NEW;
        }

        $lead = Lead::create([
            ...$request->safe()->except('assigned_to'),
            'status'      => $status,
            'assigned_to' => $assignedTo,
        ]);

        return new LeadResource($lead->load('assignedTo'));
    }

    // ─── Show Lead Profile ────────────────────────────────────────────────────
    public function show(Lead $lead): LeadResource
    {
        $this->authorize('view', $lead);

        $lead->load(['assignedTo', 'remarks.staff']);

        return new LeadResource($lead);
    }

    // ─── Update Lead ──────────────────────────────────────────────────────────
    public function update(UpdateLeadRequest $request, Lead $lead): LeadResource
    {
        $this->authorize('update', $lead);

        $lead->update($request->validated());

        return new LeadResource($lead->load('assignedTo'));
    }

    // ─── Soft Delete ──────────────────────────────────────────────────────────
    public function destroy(Lead $lead): JsonResponse
    {
        $this->authorize('delete', $lead);

        $lead->delete();

        return response()->json(['message' => 'Lead deleted.']);
    }

    // ─── Assign Lead to Staff ─────────────────────────────────────────────────
    public function assign(AssignLeadRequest $request, Lead $lead): LeadResource
    {
        $this->authorize('assign', $lead);

        // الحالة تبقى 'new' — الليد ينتقل لقائمة الموظف ولا يُصنَّف حتى يبدأ العمل
        $lead->update([
            'assigned_to' => $request->user_id,
            'status'      => Lead::STATUS_NEW,
        ]);

        return new LeadResource($lead->load('assignedTo'));
    }

    // ─── Recall Lead (admin only) ─────────────────────────────────────────────
    public function recall(Lead $lead): LeadResource
    {
        $this->authorize('recall', $lead);

        $lead->update([
            'assigned_to' => null,
            'status'      => Lead::STATUS_NEW,
        ]);

        return new LeadResource($lead->load('assignedTo'));
    }

    // ─── Toggle Small Treasure ────────────────────────────────────────────────
    public function toggleSmallTreasure(Lead $lead): JsonResponse
    {
        $this->authorize('toggleSmallTreasure', $lead);

        // Check 30-lead limit per CC user (PRD 5.3)
        if (!$lead->is_small_treasure && request()->user()->isCC()) {
            $count = Lead::where('assigned_to', request()->user()->id)
                ->where('is_small_treasure', true)
                ->count();

            if ($count >= 30) {
                return response()->json([
                    'message' => 'Small Treasure limit reached (30 leads max).',
                ], 422);
            }
        }

        $lead->update(['is_small_treasure' => !$lead->is_small_treasure]);

        return response()->json([
            'is_small_treasure' => $lead->is_small_treasure,
            'message' => $lead->is_small_treasure
                ? 'Lead added to Small Treasure.'
                : 'Lead removed from Small Treasure.',
        ]);
    }

    // ─── Open Sea List ────────────────────────────────────────────────────────
    public function openSea(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Lead::class);

        $query = Lead::where('status', Lead::STATUS_OPEN_SEA)
            ->withCount('remarks')
            ->with('assignedTo')
            ->when($request->filled('search'), fn($q) =>
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%")
            )
            ->orderBy('moved_to_open_sea_at');

        return LeadResource::collection($query->paginate(20));
    }

    // ─── Pull from Open Sea ───────────────────────────────────────────────────
    public function pullFromSea(Lead $lead): LeadResource|JsonResponse
    {
        $this->authorize('assign', $lead);

        if ($lead->status !== Lead::STATUS_OPEN_SEA) {
            return response()->json(['message' => 'Lead is not in Open Sea.'], 422);
        }

        $lead->update([
            'assigned_to'         => request()->user()->id,
            'status'              => Lead::STATUS_IN_PROGRESS,
            'moved_to_open_sea_at'=> null,
        ]);

        return new LeadResource($lead->load('assignedTo'));
    }
}
