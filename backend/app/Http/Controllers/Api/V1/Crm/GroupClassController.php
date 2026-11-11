<?php

namespace App\Http\Controllers\Api\V1\Crm;

use App\Http\Controllers\Controller;
use App\Models\GroupClass;
use App\Models\Lesson;
use App\Models\User;
use App\Services\BookingSequenceService;
use App\Services\GroupClassService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Admin scheduling of group classes. The assigned teacher starts and ends them. */
class GroupClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'scope'     => ['sometimes', 'in:upcoming,ended'],
            'status'    => ['sometimes', 'nullable', 'in:completed,cancelled'],
            'date_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'date_to'   => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ]);

        // Upcoming: not started or running, soonest first.
        // Ended: completed or cancelled, latest first, filterable by status and Jordan date.
        $ended = $request->input('scope') === 'ended';
        $day   = fn (string $date) => Carbon::parse($date, 'Asia/Amman');

        $classes = GroupClass::with(['teacher:id,name', 'lesson:id,title'])
            ->whereIn('status', $ended
                ? [GroupClass::STATUS_COMPLETED, GroupClass::STATUS_CANCELLED]
                : [GroupClass::STATUS_SCHEDULED, GroupClass::STATUS_ACTIVE])
            ->when($ended && $request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($ended && $request->filled('date_from'),
                fn ($q) => $q->where('scheduled_at', '>=', $day($request->date_from)->startOfDay()->utc()))
            ->when($ended && $request->filled('date_to'),
                fn ($q) => $q->where('scheduled_at', '<=', $day($request->date_to)->endOfDay()->utc()))
            ->orderBy('scheduled_at', $ended ? 'desc' : 'asc')
            ->paginate(20);

        return response()->json($classes->through(fn ($class) => $this->format($class)));
    }

    public function show(GroupClass $groupClass): JsonResponse
    {
        $groupClass->load(['teacher:id,name', 'lesson:id,title', 'registrations.student:id,name']);

        return response()->json([
            'class'      => $this->format($groupClass),
            'registered' => $groupClass->registrations->map(fn ($registration) => [
                'student_id'    => $registration->student_id,
                'name'          => $registration->student?->name,
                'registered_at' => $registration->registered_at?->toIso8601String(),
                'joined'        => $registration->joined_at !== null,
            ]),
        ]);
    }

    /**
     * Create one or more classes at once — all or none.
     * The same lesson may repeat, but never twice for one teacher, and a
     * teacher can't hold two lessons less than 30 minutes apart.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'classes'                => ['required', 'array', 'min:1', 'max:50'],
            'classes.*.teacher_id'   => ['required', 'integer', $this->activeTeacher()],
            'classes.*.lesson_id'    => ['required', 'integer', $this->regularLesson()],
            'classes.*.scheduled_at' => ['required', 'date'],
            'classes.*.max_seats'    => ['required', 'integer', 'min:2', 'max:200'],
        ]);

        $rows   = collect($validated['classes'])->map(fn ($row) => [
            ...$row,
            // The CRM form sends Jordan local time.
            'slot' => Carbon::parse($row['scheduled_at'], 'Asia/Amman')->utc(),
        ]);
        $errors = [];

        foreach ($rows as $i => $row) {
            $earlier = $rows->take($i)->where('teacher_id', $row['teacher_id']);

            $errors[$i] = match (true) {
                $row['slot']->isPast()
                    => 'The class time must be in the future.',
                $earlier->contains('lesson_id', $row['lesson_id'])
                    => 'This lesson is already given to this teacher in another row. Choose another teacher.',
                $earlier->contains(fn ($other) => abs($other['slot']->diffInMinutes($row['slot'])) <= BookingSequenceService::MIN_GAP_MINUTES)
                    => 'This teacher already has a group class at this time.',
                default => GroupClassService::scheduleProblem($row['teacher_id'], $row['lesson_id'], $row['slot']),
            };
        }

        $errors = array_filter($errors);
        if ($errors) {
            return response()->json(['message' => 'Some classes could not be scheduled.', 'errors' => $errors], 422);
        }

        $titles  = Lesson::whereIn('id', $rows->pluck('lesson_id'))->pluck('title', 'id');
        $created = DB::transaction(fn () => $rows->map(fn ($row) => GroupClass::create([
            'teacher_id'   => $row['teacher_id'],
            'lesson_id'    => $row['lesson_id'],
            'title'        => $titles[$row['lesson_id']],
            'scheduled_at' => $row['slot'],
            'max_seats'    => $row['max_seats'],
            'status'       => GroupClass::STATUS_SCHEDULED,
        ])));

        return response()->json(['created' => $created->count()], 201);
    }

    /** Edit a class that has not started. */
    public function update(GroupClass $groupClass, Request $request): JsonResponse
    {
        if (! $groupClass->isScheduled()) {
            return response()->json(['message' => 'Only scheduled classes can be edited.'], 422);
        }

        $validated = $request->validate([
            'teacher_id'   => ['required', 'integer', $this->activeTeacher()],
            'lesson_id'    => ['required', 'integer', $this->regularLesson()],
            'scheduled_at' => ['required', 'date'],
            'max_seats'    => ['required', 'integer', 'min:2', 'max:200'],
        ]);

        $slot = Carbon::parse($validated['scheduled_at'], 'Asia/Amman')->utc();

        // Registered students paid a credit for this lesson.
        if ($validated['lesson_id'] !== $groupClass->lesson_id && $groupClass->registered_count > 0) {
            return response()->json(['message' => 'The lesson cannot be changed after students have registered.'], 422);
        }

        if ($validated['max_seats'] < $groupClass->registered_count) {
            return response()->json([
                'message' => "Seats cannot be fewer than the {$groupClass->registered_count} registered students.",
            ], 422);
        }

        if ($slot->isPast()) {
            return response()->json(['message' => 'The class time must be in the future.'], 422);
        }

        if ($problem = GroupClassService::scheduleProblem($validated['teacher_id'], $validated['lesson_id'], $slot, $groupClass->id)) {
            return response()->json(['message' => $problem], 422);
        }

        $groupClass->update([
            'teacher_id'   => $validated['teacher_id'],
            'lesson_id'    => $validated['lesson_id'],
            'title'        => Lesson::whereKey($validated['lesson_id'])->value('title'),
            'scheduled_at' => $slot,
            'max_seats'    => $validated['max_seats'],
        ]);

        return response()->json(['class' => $this->format($groupClass->fresh(['teacher:id,name', 'lesson:id,title']))]);
    }

    public function cancel(GroupClass $groupClass, GroupClassService $classes): JsonResponse
    {
        if (! $classes->cancel($groupClass)) {
            return response()->json(['message' => 'Only scheduled classes can be cancelled.'], 422);
        }

        return response()->json(['message' => 'Class cancelled. Registered students received their credit back.']);
    }

    private function activeTeacher()
    {
        return Rule::exists('users', 'id')->where(fn ($q) => $q->where('role', User::ROLE_TEACHER)->whereNull('deleted_at'));
    }

    private function regularLesson()
    {
        return Rule::exists('lessons', 'id')->where(fn ($q) => $q->where('is_assessment', false));
    }

    private function format(GroupClass $class): array
    {
        return [
            'id'               => $class->id,
            'title'            => $class->title,
            'description'      => $class->description,
            'status'           => $class->status,
            'scheduled_at'     => $class->scheduled_at?->toIso8601String(),
            'max_seats'        => $class->max_seats,
            'registered_count' => $class->registered_count,
            'teacher'          => $class->teacher ? ['id' => $class->teacher->id, 'name' => $class->teacher->name] : null,
            'lesson'           => $class->lesson ? ['id' => $class->lesson->id, 'title' => $class->lesson->title] : null,
        ];
    }
}
