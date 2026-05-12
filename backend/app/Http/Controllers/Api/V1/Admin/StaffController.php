<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\CreateStaffRequest;
use App\Http\Requests\Api\V1\Admin\CreateTeacherRequest;
use App\Http\Requests\Api\V1\Admin\UpdateStaffRequest;
use App\Http\Resources\Api\V1\StaffResource;
use App\Models\Lead;
use App\Models\Teacher;
use App\Models\User;
use App\Services\TeacherCodeGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StaffController extends Controller
{
    // ─── List All Staff ───────────────────────────────────────────────────────
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::withTrashed()
            ->whereIn('role', ['cc', 'ss', 'teacher'])
            ->with('teacher')
            ->when($request->filled('role'), fn($q) => $q->where('role', $request->role))
            ->when($request->filled('search'), fn($q) =>
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%")
            )
            ->latest();

        return StaffResource::collection($query->paginate(20));
    }

    // ─── Show One Staff Member ────────────────────────────────────────────────
    public function show(int $id): StaffResource|JsonResponse
    {
        $user = User::withTrashed()
            ->with('teacher')
            ->findOrFail($id);

        if (!in_array($user->role, ['cc', 'ss', 'teacher'])) {
            return response()->json(['message' => 'Not a staff member.'], 404);
        }

        return new StaffResource($user);
    }

    // ─── Create CC or SS User ─────────────────────────────────────────────────
    public function createCrmStaff(CreateStaffRequest $request): StaffResource
    {
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password,
            'role'     => $request->role,
            'timezone' => 'Asia/Amman',
        ]);

        Log::info("New CRM staff created: {$user->email} [{$user->role}] by admin #{$request->user()->id}");

        return new StaffResource($user);
    }

    // ─── Create Teacher Account ───────────────────────────────────────────────
    public function createTeacher(
        CreateTeacherRequest $request,
        TeacherCodeGenerator $generator
    ): StaffResource {

        $user = DB::transaction(function () use ($request, $generator) {

            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => $request->password,
                'role'     => User::ROLE_TEACHER,
                'timezone' => 'Asia/Amman',
            ]);

            Teacher::create([
                'user_id'         => $user->id,
                'teacher_code'    => $generator->generate(),
                'bio'             => $request->bio,
                'specialization'  => $request->specialization,
                'commission_rate' => $request->commission_rate ?? 0,
            ]);

            return $user;
        });

        // TODO: send welcome email with credentials in production
        Log::info("New teacher created: {$user->email} [code: {$user->teacher->teacher_code}]");

        return new StaffResource($user->load('teacher'));
    }

    // ─── Update Staff Member ──────────────────────────────────────────────────
    public function update(UpdateStaffRequest $request, int $id): StaffResource|JsonResponse
    {
        $user = User::withTrashed()->with('teacher')->findOrFail($id);

        if (!in_array($user->role, ['cc', 'ss', 'teacher'])) {
            return response()->json(['message' => 'Not a staff member.'], 404);
        }

        DB::transaction(function () use ($request, $user) {

            $userData = $request->only(['name', 'email']);

            if ($request->filled('password')) {
                $userData['password'] = $request->password;
            }

            // Role switch: cc ↔ ss only (teachers keep their role)
            if ($request->filled('role') && !$user->isTeacher()) {
                $userData['role'] = $request->role;
            }

            $user->update($userData);

            // Update teacher profile fields
            if ($user->isTeacher() && $user->teacher) {
                $user->teacher->update(
                    $request->only(['bio', 'specialization', 'commission_rate'])
                );
            }
        });

        return new StaffResource($user->fresh()->load('teacher'));
    }

    // ─── Toggle Active / Deactivate ───────────────────────────────────────────
    public function toggleStatus(int $id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);

        if (!in_array($user->role, ['cc', 'ss', 'teacher'])) {
            return response()->json(['message' => 'Not a staff member.'], 404);
        }

        if ($user->trashed()) {
            $user->restore();
            $status = 'activated';
        } else {
            $user->delete(); // soft delete = deactivate
            $status = 'deactivated';
        }

        return response()->json([
            'message'   => "Staff member {$status}.",
            'is_active' => !$user->trashed(),
        ]);
    }

    // ─── CC Performance Report ────────────────────────────────────────────────
    public function performance(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year',  now()->year);

        $staff = User::where('role', User::ROLE_CC)
            ->withCount([
                'assignedLeads as total_leads',

                'assignedLeads as conversions' => fn($q) =>
                    $q->where('status', Lead::STATUS_SUBSCRIBER)
                      ->whereMonth('converted_at', $month)
                      ->whereYear('converted_at', $year),

                'assignedLeads as working_leads' => fn($q) =>
                    $q->whereIn('status', [Lead::STATUS_ASSIGNED, Lead::STATUS_WORKING]),

                'assignedLeads as open_sea_leads' => fn($q) =>
                    $q->where('status', Lead::STATUS_OPEN_SEA),

                'assignedLeads as small_treasure_leads' => fn($q) =>
                    $q->where('is_small_treasure', true),
            ])
            ->get()
            ->map(fn($s) => [
                'id'                 => $s->id,
                'name'               => $s->name,
                'email'              => $s->email,
                'total_leads'        => $s->total_leads,
                'conversions'        => $s->conversions,
                'working_leads'      => $s->working_leads,
                'open_sea_leads'     => $s->open_sea_leads,
                'small_treasure'     => $s->small_treasure_leads,
                'conversion_rate'    => $s->total_leads > 0
                    ? round(($s->conversions / $s->total_leads) * 100, 1)
                    : 0,
                'last_remark_at'     => $this->lastRemarkDate($s->id),
            ])
            ->sortByDesc('conversions')
            ->values();

        return response()->json([
            'period' => ['month' => $month, 'year' => $year],
            'staff'  => $staff,
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────
    private function lastRemarkDate(int $userId): ?string
    {
        $date = DB::table('lead_remarks')
            ->where('staff_id', $userId)
            ->latest('created_at')
            ->value('created_at');

        return $date
            ? \Carbon\Carbon::parse($date)->setTimezone('Asia/Amman')->format('Y-m-d H:i')
            : null;
    }
}
