<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\NotebookEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Student personal notebook — vocabulary, lesson notes, anything.
 * Entries can optionally be linked to a lesson for context.
 * Pinned entries appear at the top.
 */
class NotebookController extends Controller
{
    // ─── List ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $entries = NotebookEntry::forStudent($request->user()->id)
            ->with('lesson:id,title')
            ->when($request->filled('lesson_id'), fn($q) => $q->where('lesson_id', $request->lesson_id))
            ->when($request->filled('search'), fn($q) =>
                $q->where(fn($q2) =>
                    $q2->where('title', 'ilike', "%{$request->search}%")
                       ->orWhere('content', 'ilike', "%{$request->search}%")
                )
            )
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($entries->through(fn($e) => $this->format($e)));
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'     => ['sometimes', 'nullable', 'string', 'max:200'],
            'content'   => ['required', 'string', 'max:5000'],
            'category'  => ['sometimes', 'string', 'in:general,grammar,examples,observations'],
            'lesson_id' => ['sometimes', 'nullable', 'integer', 'exists:lessons,id'],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $entry = NotebookEntry::create([
            'student_id' => $request->user()->id,
            ...$validated,
        ]);

        return response()->json([
            'message' => 'Note saved.',
            'entry'   => $this->format($entry),
        ], 201);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(NotebookEntry $notebookEntry, Request $request): JsonResponse
    {
        if ($notebookEntry->student_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json(['entry' => $this->format($notebookEntry->load('lesson:id,title'))]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public function update(NotebookEntry $notebookEntry, Request $request): JsonResponse
    {
        if ($notebookEntry->student_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'title'     => ['sometimes', 'nullable', 'string', 'max:200'],
            'content'   => ['sometimes', 'string', 'max:5000'],
            'category'  => ['sometimes', 'string', 'in:general,grammar,examples,observations'],
            'lesson_id' => ['sometimes', 'nullable', 'integer', 'exists:lessons,id'],
            'is_pinned' => ['sometimes', 'boolean'],
        ]);

        $notebookEntry->update($validated);

        return response()->json([
            'message' => 'Note updated.',
            'entry'   => $this->format($notebookEntry->fresh()),
        ]);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    public function destroy(NotebookEntry $notebookEntry, Request $request): JsonResponse
    {
        if ($notebookEntry->student_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $notebookEntry->delete();

        return response()->json(['message' => 'Note deleted.']);
    }

    // ─── Toggle Pin ───────────────────────────────────────────────────────────

    public function togglePin(NotebookEntry $notebookEntry, Request $request): JsonResponse
    {
        if ($notebookEntry->student_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $notebookEntry->update(['is_pinned' => !$notebookEntry->is_pinned]);

        return response()->json([
            'is_pinned' => $notebookEntry->is_pinned,
            'message'   => $notebookEntry->is_pinned ? 'Note pinned.' : 'Note unpinned.',
        ]);
    }

    // ─── Format ───────────────────────────────────────────────────────────────

    private function format(NotebookEntry $e): array
    {
        return [
            'id'         => $e->id,
            'title'      => $e->title,
            'content'    => $e->content,
            'category'   => $e->category ?? 'general',
            'is_pinned'  => $e->is_pinned,
            'lesson'     => $e->lesson ? ['id' => $e->lesson->id, 'title' => $e->lesson->title] : null,
            'created_at' => $e->created_at?->toIso8601String(),
            'updated_at' => $e->updated_at?->toIso8601String(),
        ];
    }
}
