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
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    // ─── List Leads ───────────────────────────────────────────────────────────
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Lead::class);

        $query = Lead::withCount('remarks')
            ->with('assignedTo')
            ->with('latestDemoSession')
            ->latest();

        // CC / LP (SS) see only their own leads — Admin sees all
        if (!$request->user()->isSuperAdmin()) {
            $query->where('assigned_to', $request->user()->id);
        }

        // Filters
        // status يقبل قيمة واحدة أو مصفوفة: ?status=in_process أو ?status[]=in_process&status[]=loss
        if ($request->filled('status')) {
            $statuses = is_array($request->status)
                ? $request->status
                : [$request->status];
            $query->whereIn('status', $statuses);

            // قاعدة New Leads:
            // الليدة تظهر فقط إذا:
            //   أ) لم يُحجز لها أي حصة تقييمية سابقاً على الإطلاق (ليدة جديدة طازجة)
            //   ب) عندها حجز حصة نشط حالياً (pending/confirmed)
            // ليدة سبق وانتهت حصتها ولا يوجد حجز جديد → لا تظهر حتى تعيد الحجز
            if ($statuses === ['new']) {
                $query->where(function ($q) {
                    $q->whereDoesntHave('sessionRequests', fn($sq) =>
                        $sq->where('type', \App\Models\SessionRequest::TYPE_DEMO)
                    )
                    ->orWhereHas('latestDemoSession');
                });
            }
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
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        return LeadResource::collection($query->paginate(20));
    }

    // ─── Create Lead ──────────────────────────────────────────────────────────
    public function store(StoreLeadRequest $request): LeadResource|JsonResponse
    {
        $this->authorize('create', Lead::class);

        $actor = $request->user();
        $phone = $request->validated()['phone'];

        // ── Duplicate phone check — رسالة عربية واضحة ──────────────────────────
        $existing = Lead::where('phone', $phone)->first();

        if ($existing) {
            // Lead belongs to the requesting CC themselves
            if ($existing->assigned_to === $actor->id) {
                return response()->json([
                    'message'  => 'هذا العميل موجود بالفعل في قائمتك.',
                    'lead_id'  => $existing->id,
                    'conflict' => 'own',
                ], 409);
            }

            // Lead is in Open Sea — redirect to pull from there
            if ($existing->status === Lead::STATUS_OPEN_SEA) {
                return response()->json([
                    'message'  => 'هذا العميل موجود في البحر المفتوح — يمكنك سحبه من صفحة البحر المفتوح.',
                    'lead_id'  => $existing->id,
                    'conflict' => 'open_sea',
                ], 409);
            }

            // Lead belongs to another employee (assigned and not open sea)
            if ($existing->assigned_to && $existing->assigned_to !== $actor->id) {
                // The admin may reassign any lead, so don't tell them they can't
                // take it — point them at the profile where they can reassign.
                if ($actor->isSuperAdmin()) {
                    $holder = User::find($existing->assigned_to)?->name;

                    return response()->json([
                        'message'  => $holder
                            ? "هذا العميل مسجّل لدى الموظف {$holder} — افتح بروفايله لإعادة تعيينه."
                            : 'هذا العميل مسجّل لدى موظف آخر — افتح بروفايله لإعادة تعيينه.',
                        'lead_id'  => $existing->id,
                        'conflict' => 'own',
                    ], 409);
                }

                return response()->json([
                    'message'  => 'هذا الرقم مسجّل مسبقاً لدى موظف آخر ولا يمكنك أخذه.',
                    'conflict' => 'other_staff',
                ], 409);
            }

            // Lead is unassigned (admin pool) — only admin should handle it
            if (is_null($existing->assigned_to)) {
                // The admin IS the manager, so "go talk to the manager" is a dead
                // end for them (that conflict type has no action in the UI either).
                // The unassigned pool is their own list → report it as such so they
                // get the "open profile" action and can assign it from there.
                if ($actor->isSuperAdmin()) {
                    return response()->json([
                        'message'  => 'هذا العميل موجود بالفعل في قائمة المدير (غير معيّن) — افتح بروفايله لتعيينه لموظف.',
                        'lead_id'  => $existing->id,
                        'conflict' => 'own',
                    ], 409);
                }

                return response()->json([
                    'message'  => 'هذا العميل موجود في قائمة المدير — تواصل مع المدير لتعيينه.',
                    'lead_id'  => $existing->id,
                    'conflict' => 'admin_pool',
                ], 409);
            }
        }

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

        $lead = DB::transaction(function () use ($request, $status, $assignedTo) {
            $phone = $request->validated()['phone'];

            $attributes = [
                ...$request->safe()->except('assigned_to'),
                'status'            => $status,
                'assigned_to'       => $assignedTo,
                'first_assigned_to' => $assignedTo,
            ];

            // 1. Create the Lead record — or revive a soft-deleted one holding the
            //    same phone. leads.phone is UNIQUE and that index still counts
            //    deleted rows, so a plain create() would die on a constraint
            //    violation (500) and the number would be permanently unusable —
            //    there is no restore endpoint. Any LIVE duplicate already returned
            //    409 above, so anything found here is a deleted lead being re-added.
            $lead = Lead::withTrashed()->where('phone', $phone)->first();

            if ($lead) {
                $lead->restore();
                $lead->fill($attributes)->save();
            } else {
                $lead = Lead::create($attributes);
            }

            // 2. Create User account (student role) so they can log in via the app
            $user  = User::firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => $request->validated()['name'],
                    'role' => User::ROLE_STUDENT,
                ]
            );

            // 3. Create Student profile linking user ↔ lead
            if (!$user->student) {
                \App\Models\Student::create([
                    'user_id' => $user->id,
                    'lead_id' => $lead->id,
                ]);
            } elseif (!$user->student->lead_id) {
                $user->student->update(['lead_id' => $lead->id]);
            }

            return $lead;
        });

        return new LeadResource($lead->load('assignedTo'));
    }

    // ─── Show Lead Profile ────────────────────────────────────────────────────
    public function show(Lead $lead): LeadResource
    {
        $this->authorize('view', $lead);

        $lead->load(['assignedTo', 'remarks.staff', 'latestDemoSession', 'student.subscriptions.activatedBy']);

        return new LeadResource($lead);
    }

    // ─── Student Progress ─────────────────────────────────────────────────────
    /**
     * GET /crm/leads/{lead}/progress
     * Returns the SAME progress summary the student sees in their app
     * (via StudentProgressService). Empty if the lead has no student account yet.
     */
    public function progress(Lead $lead, \App\Services\StudentProgressService $progress): JsonResponse
    {
        $this->authorize('view', $lead);

        $user = $lead->student?->user;
        if (!$user) {
            return response()->json(['has_account' => false, 'summary' => null]);
        }

        return response()->json([
            'has_account' => true,
            'summary'     => $progress->summary($user),
        ]);
    }

    // ─── Update Lead ──────────────────────────────────────────────────────────
    public function update(UpdateLeadRequest $request, Lead $lead): LeadResource|JsonResponse
    {
        $this->authorize('update', $lead);

        // المشترك محمي — حالته لا تتغير يدوياً أبداً (تتحكم بها الاشتراكات فقط)
        if ($lead->status === Lead::STATUS_SUBSCRIBER && $request->has('status')) {
            return response()->json([
                'message' => 'لا يمكن تغيير حالة مشترك يدوياً.',
            ], 422);
        }

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
        $updates = [
            'assigned_to' => $request->user_id,
            'status'      => Lead::STATUS_NEW,
        ];
        // first_assigned_to يتحفظ مرة وحدة فقط (أول تعيين)
        if (is_null($lead->first_assigned_to)) {
            $updates['first_assigned_to'] = $request->user_id;
        }
        $lead->update($updates);

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

        $perPage = min((int) ($request->query('per_page', 10)), 100);

        $query = Lead::where('status', Lead::STATUS_OPEN_SEA)
            ->withCount('remarks')
            ->with(['assignedTo', 'remarks.staff'])
            ->orderBy('moved_to_open_sea_at');

        // بحث برقم الجوال
        if ($request->filled('phone')) {
            $query->where('phone', 'like', "%{$request->phone}%");
        }

        // فلتر نطاق التاريخ — تاريخ دخول البحر المفتوح
        if ($request->filled('date_from')) {
            $query->whereDate('moved_to_open_sea_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('moved_to_open_sea_at', '<=', $request->date_to);
        }

        return LeadResource::collection($query->paginate($perPage));
    }

    // ─── Pull from Open Sea ───────────────────────────────────────────────────
    public function pullFromSea(Lead $lead): LeadResource|JsonResponse
    {
        $this->authorize('assign', $lead);

        // Wrap in a transaction with a row-level lock to prevent two employees
        // from pulling the same lead simultaneously (race condition).
        return DB::transaction(function () use ($lead) {
            // Re-fetch with an exclusive lock so concurrent requests queue up.
            $lead = Lead::lockForUpdate()->findOrFail($lead->id);

            if ($lead->status !== Lead::STATUS_OPEN_SEA) {
                return response()->json([
                    'message' => 'هذه الليدة لم تعد في البحر المفتوح — ربما سحبها موظف آخر للتو.',
                ], 422);
            }

            $lead->update([
                'assigned_to'          => request()->user()->id,
                'status'               => Lead::STATUS_NO_ANSWER,
                'moved_to_open_sea_at' => null,
            ]);

            return new LeadResource($lead->load('assignedTo'));
        });
    }
}
