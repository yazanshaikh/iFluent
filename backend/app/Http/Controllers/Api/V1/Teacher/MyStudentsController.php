<?php

namespace App\Http\Controllers\Api\V1\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The students assigned to the signed-in teacher from the CRM
 * (students.teacher_user_id). The teacher can remove a student, which sends
 * them back to the CRM's "no teacher" list; adding stays in the CRM.
 */
class MyStudentsController extends Controller
{
    /** GET /teacher/my-students */
    public function index(Request $request): JsonResponse
    {
        $students = Student::where('teacher_user_id', $request->user()->id)
            ->with(['user:id,name,lesson_credits', 'lead:id,name'])
            ->get()
            ->map(fn (Student $student) => [
                'id'                => $student->id,
                'name'              => $student->lead?->name ?? $student->user?->name ?? '—',
                'remaining_lessons' => (int) ($student->user?->lesson_credits ?? 0),
            ])
            ->sortBy('name')
            ->values();

        return response()->json(['data' => $students]);
    }

    /** DELETE /teacher/my-students/{student} */
    public function destroy(Student $student, Request $request): JsonResponse
    {
        if ((int) $student->teacher_user_id !== (int) $request->user()->id) {
            return response()->json(['message' => 'This student is no longer assigned to you. Your list has been refreshed.'], 403);
        }

        $student->update(['teacher_user_id' => null]);

        return response()->json(['message' => 'Student removed from your list.']);
    }
}
