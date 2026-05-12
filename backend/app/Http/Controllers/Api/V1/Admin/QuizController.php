<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin Quiz Management
 *
 * Endpoints:
 *   GET    /admin/lessons/{lesson}/quiz          → get quiz + questions (with correct_answer)
 *   POST   /admin/lessons/{lesson}/quiz          → create quiz for lesson
 *   POST   /admin/lessons/{lesson}/quiz/questions → add a question
 *   PUT    /admin/quiz-questions/{question}       → update a question
 *   DELETE /admin/quiz-questions/{question}       → remove a question
 */
class QuizController extends Controller
{
    // ─── Get Quiz for Lesson ──────────────────────────────────────────────────

    public function show(Lesson $lesson): JsonResponse
    {
        $quiz = Quiz::with('questions')
            ->where('lesson_id', $lesson->id)
            ->first();

        if (!$quiz) {
            return response()->json(['message' => 'No quiz for this lesson yet.'], 404);
        }

        $bankSize = $quiz->questions->count();

        return response()->json([
            'quiz' => [
                'id'                    => $quiz->id,
                'lesson_id'             => $quiz->lesson_id,
                'type'                  => $quiz->type,
                'is_active'             => $quiz->is_active,
                'questions_per_attempt' => $quiz->questions_per_attempt,
                'min_bank_size'         => $quiz->min_bank_size,
                'bank_size'             => $bankSize,
                'bank_ready'            => $bankSize >= $quiz->min_bank_size,
                'questions'             => $quiz->questions->map(fn($q) => [
                    'id'             => $q->id,
                    'question'       => $q->question,
                    'options'        => $q->options,
                    'correct_answer' => $q->correct_answer,
                    'order'          => $q->order,
                ]),
            ],
        ]);
    }

    // ─── Create Quiz ──────────────────────────────────────────────────────────

    public function store(Lesson $lesson, Request $request): JsonResponse
    {
        if (Quiz::where('lesson_id', $lesson->id)->exists()) {
            return response()->json(['message' => 'A quiz already exists for this lesson.'], 422);
        }

        $validated = $request->validate([
            'type'                  => ['required', 'in:lesson,comprehensive'],
            'is_active'             => ['sometimes', 'boolean'],
            'questions_per_attempt' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'min_bank_size'         => ['sometimes', 'integer', 'min:1', 'max:200'],
        ]);

        $quiz = Quiz::create([
            'lesson_id'             => $lesson->id,
            'type'                  => $validated['type'],
            'is_active'             => $validated['is_active'] ?? true,
            'questions_per_attempt' => $validated['questions_per_attempt'] ?? 10,
            'min_bank_size'         => $validated['min_bank_size'] ?? 10,
        ]);

        return response()->json([
            'message' => 'Quiz created.',
            'quiz'    => ['id' => $quiz->id, 'type' => $quiz->type, 'is_active' => $quiz->is_active],
        ], 201);
    }

    // ─── Add Question ─────────────────────────────────────────────────────────

    public function addQuestion(Lesson $lesson, Request $request): JsonResponse
    {
        $quiz = Quiz::where('lesson_id', $lesson->id)->first();

        if (!$quiz) {
            return response()->json(['message' => 'Create a quiz for this lesson first.'], 422);
        }

        $validated = $request->validate([
            'question'       => ['required', 'string', 'max:1000'],
            'options'        => ['required', 'array', 'min:2', 'max:4'],
            'options.*'      => ['required', 'string', 'max:500'],
            'correct_answer' => ['required', 'integer', 'min:0'],
            'order'          => ['sometimes', 'integer', 'min:0'],
        ]);

        // Validate correct_answer is within options range
        if ($validated['correct_answer'] >= count($validated['options'])) {
            return response()->json(['message' => 'correct_answer index is out of range for the provided options.'], 422);
        }

        // Auto-set order if not provided
        if (!isset($validated['order'])) {
            $validated['order'] = $quiz->questions()->max('order') + 1;
        }

        $question = $quiz->questions()->create($validated);

        return response()->json([
            'message'  => 'Question added.',
            'question' => [
                'id'             => $question->id,
                'question'       => $question->question,
                'options'        => $question->options,
                'correct_answer' => $question->correct_answer,
                'order'          => $question->order,
            ],
        ], 201);
    }

    // ─── Update Question ──────────────────────────────────────────────────────

    public function updateQuestion(QuizQuestion $question, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question'       => ['sometimes', 'string', 'max:1000'],
            'options'        => ['sometimes', 'array', 'min:2', 'max:4'],
            'options.*'      => ['required_with:options', 'string', 'max:500'],
            'correct_answer' => ['sometimes', 'integer', 'min:0'],
            'order'          => ['sometimes', 'integer', 'min:0'],
        ]);

        // Validate correct_answer against options if both supplied
        $optionsCount = count($validated['options'] ?? $question->options);
        if (isset($validated['correct_answer']) && $validated['correct_answer'] >= $optionsCount) {
            return response()->json(['message' => 'correct_answer index is out of range.'], 422);
        }

        $question->update($validated);

        return response()->json([
            'message'  => 'Question updated.',
            'question' => [
                'id'             => $question->id,
                'question'       => $question->question,
                'options'        => $question->options,
                'correct_answer' => $question->correct_answer,
                'order'          => $question->order,
            ],
        ]);
    }

    // ─── Delete Question ──────────────────────────────────────────────────────

    public function deleteQuestion(QuizQuestion $question): JsonResponse
    {
        $question->delete();
        return response()->json(['message' => 'Question removed.']);
    }

    // ─── Toggle Quiz Active ───────────────────────────────────────────────────

    public function toggleActive(Lesson $lesson): JsonResponse
    {
        $quiz = Quiz::where('lesson_id', $lesson->id)->first();

        if (!$quiz) {
            return response()->json(['message' => 'No quiz found for this lesson.'], 404);
        }

        $quiz->update(['is_active' => !$quiz->is_active]);

        return response()->json([
            'message'   => 'Quiz ' . ($quiz->is_active ? 'activated' : 'deactivated') . '.',
            'is_active' => $quiz->is_active,
        ]);
    }
}
