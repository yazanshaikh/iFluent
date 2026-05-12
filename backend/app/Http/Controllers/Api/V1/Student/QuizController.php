<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\StudentProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Quiz Engine — Question Bank + Attempt System
 *
 * Every quiz has a BANK of questions (admin adds as many as they want).
 * Each attempt randomly picks `questions_per_attempt` from the bank.
 * If the student fails → new attempt → DIFFERENT random set of questions.
 *
 * Flow:
 *   1. GET  /student/lessons/{lesson}/quiz
 *      → Creates a new attempt, randomly selects N questions, returns them (NO correct_answer)
 *      → If there's an unsubmitted pending attempt, returns that one (prevents refreshing to get easier questions)
 *
 *   2. POST /student/lessons/{lesson}/quiz/submit
 *      → { attempt_id, answers: { "question_id": answer_index } }
 *      → Grades the attempt, returns score + breakdown + correct answers
 *      → If passed: updates student_progress → next lesson unlocked
 *      → If failed: student can call GET again to get a NEW random set
 */
class QuizController extends Controller
{
    const PASS_MARK = 60; // 60% required to pass

    // ─── Show / Start Quiz Attempt ────────────────────────────────────────────

    public function show(Lesson $lesson, Request $request): JsonResponse
    {
        $student = $request->user();

        // Gate: enrollment
        if (!$this->isEnrolled($student, $lesson)) {
            return response()->json(['message' => 'You are not enrolled in this unit.'], 403);
        }

        // Gate: lesson gating (previous lesson must be passed)
        if (!$this->isLessonUnlocked($student->id, $lesson)) {
            return response()->json([
                'message' => 'Complete and pass the previous lesson quiz first.',
            ], 403);
        }

        $quiz = Quiz::where('lesson_id', $lesson->id)
            ->where('is_active', true)
            ->first();

        if (!$quiz) {
            return response()->json(['message' => 'No quiz available for this lesson.'], 404);
        }

        // Check bank size
        $bankSize = $quiz->questions()->count();
        if ($bankSize === 0) {
            return response()->json(['message' => 'This quiz has no questions yet.'], 404);
        }

        // ── Reuse pending attempt (prevent refreshing to fish for easier questions) ──
        $pendingAttempt = QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->whereNull('submitted_at')
            ->latest()
            ->first();

        if ($pendingAttempt) {
            return $this->formatAttemptResponse($quiz, $lesson, $pendingAttempt, $student);
        }

        // ── Create new attempt with random questions ───────────────────────────
        $questionsPerAttempt = min($quiz->questions_per_attempt, $bankSize);

        // Pick random question IDs from bank
        $randomIds = $quiz->questions()
            ->inRandomOrder()
            ->limit($questionsPerAttempt)
            ->pluck('id')
            ->toArray();

        $attempt = QuizAttempt::create([
            'student_id'            => $student->id,
            'quiz_id'               => $quiz->id,
            'lesson_id'             => $lesson->id,
            'selected_question_ids' => $randomIds,
            'started_at'            => now(),
        ]);

        return $this->formatAttemptResponse($quiz, $lesson, $attempt, $student);
    }

    // ─── Submit Quiz Attempt ──────────────────────────────────────────────────

    /**
     * Request body:
     * {
     *   "attempt_id": 123,
     *   "answers": { "45": 2, "46": 0, "47": 1, ... }
     * }
     */
    public function submit(Lesson $lesson, Request $request): JsonResponse
    {
        $student = $request->user();

        if (!$this->isEnrolled($student, $lesson)) {
            return response()->json(['message' => 'You are not enrolled in this unit.'], 403);
        }

        $validated = $request->validate([
            'attempt_id'  => ['required', 'integer', 'exists:quiz_attempts,id'],
            'answers'     => ['required', 'array', 'min:1'],
            'answers.*'   => ['required', 'integer', 'min:0', 'max:3'],
        ]);

        // Load the attempt — must belong to this student and lesson, must be pending
        $attempt = QuizAttempt::where('id', $validated['attempt_id'])
            ->where('student_id', $student->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if (!$attempt) {
            return response()->json(['message' => 'Attempt not found or does not belong to you.'], 404);
        }

        if ($attempt->isSubmitted()) {
            return response()->json([
                'message' => 'This attempt was already submitted.',
                'score'   => $attempt->score,
                'passed'  => $attempt->passed,
            ], 422);
        }

        // ── Grade the attempt ─────────────────────────────────────────────────
        // Load only the questions that were selected for this attempt
        $questions = \App\Models\QuizQuestion::whereIn('id', $attempt->selected_question_ids)
            ->get()
            ->keyBy('id');

        $totalQ       = $questions->count();
        $correctCount = 0;
        $breakdown    = [];

        foreach ($validated['answers'] as $questionId => $answerIndex) {
            $question = $questions->get((int) $questionId);

            if (!$question) {
                continue; // question not in this attempt's set — ignore
            }

            $isCorrect = $question->isCorrect((int) $answerIndex);
            if ($isCorrect) {
                $correctCount++;
            }

            $breakdown[] = [
                'question_id'    => $question->id,
                'question'       => $question->question,
                'options'        => $question->options,
                'your_answer'    => (int) $answerIndex,
                'correct_answer' => $question->correct_answer, // revealed after submit
                'is_correct'     => $isCorrect,
            ];
        }

        // Cover questions the student didn't answer
        foreach ($attempt->selected_question_ids as $qId) {
            if (!isset($validated['answers'][$qId]) && !isset($validated['answers'][(string) $qId])) {
                $question = $questions->get($qId);
                if ($question) {
                    $breakdown[] = [
                        'question_id'    => $question->id,
                        'question'       => $question->question,
                        'options'        => $question->options,
                        'your_answer'    => null,
                        'correct_answer' => $question->correct_answer,
                        'is_correct'     => false,
                    ];
                }
            }
        }

        $score  = $totalQ > 0 ? (int) round(($correctCount / $totalQ) * 100) : 0;
        $passed = $score >= self::PASS_MARK;

        // ── Save attempt result ───────────────────────────────────────────────
        $nextLesson = null;

        DB::transaction(function () use ($attempt, $score, $correctCount, $totalQ, $passed, $validated, $student, $lesson, &$nextLesson) {
            $attempt->update([
                'submitted_answers' => $validated['answers'],
                'score'             => $score,
                'correct_count'     => $correctCount,
                'total_questions'   => $totalQ,
                'passed'            => $passed,
                'submitted_at'      => now(),
            ]);

            // Update overall student progress for this lesson
            $progress = StudentProgress::firstOrNew([
                'student_id' => $student->id,
                'lesson_id'  => $lesson->id,
            ]);

            $isNewBest = $score > ($progress->score ?? -1);
            $progress->quiz_id  = $attempt->quiz_id;
            $progress->attempts = ($progress->attempts ?? 0) + 1;

            if ($isNewBest) {
                $progress->score = $score;
            }

            if ($passed && !$progress->passed) {
                $progress->passed            = true;
                $progress->passed_at         = now();
                $progress->lesson_completed  = true;
                $progress->completed_at      = now();
            }

            $progress->save();
        });

        // Next lesson info (only for regular lessons, only on pass)
        if ($passed && !$lesson->is_assessment) {
            $nextLesson = Lesson::where('unit_id', $lesson->unit_id)
                ->where('order', '>', $lesson->order)
                ->where('is_active', true)
                ->orderBy('order')
                ->select(['id', 'title', 'order'])
                ->first();
        }

        // Count total attempts for this quiz by this student
        $totalAttempts = QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $attempt->quiz_id)
            ->whereNotNull('submitted_at')
            ->count();

        return response()->json([
            'result' => [
                'attempt_id'    => $attempt->id,
                'score'         => $score,
                'passed'        => $passed,
                'correct'       => $correctCount,
                'total'         => $totalQ,
                'total_attempts'=> $totalAttempts,
                'pass_mark'     => self::PASS_MARK,
                'breakdown'     => $breakdown,
            ],
            'next_lesson' => $nextLesson ? [
                'id'    => $nextLesson->id,
                'title' => $nextLesson->title,
                'order' => $nextLesson->order,
            ] : null,
            'can_retry' => !$passed,
            'message'   => $passed
                ? ($nextLesson ? 'أحسنت! تم فتح الدرس التالي.' : 'مبروك! أكملت هذه الوحدة.')
                : "حصلت على {$score}%. تحتاج {$this->PASS_MARK}% للاجتياز. حاول مرة أخرى بأسئلة مختلفة!",
        ]);
    }

    // ─── Student Progress ─────────────────────────────────────────────────────

    public function progress(Request $request): JsonResponse
    {
        $student = $request->user();

        $progressRecords = StudentProgress::where('student_id', $student->id)
            ->with(['lesson:id,title,order,unit_id,level_id,is_assessment'])
            ->get();

        // Also get attempt counts per quiz
        $attemptCounts = QuizAttempt::where('student_id', $student->id)
            ->whereNotNull('submitted_at')
            ->selectRaw('lesson_id, count(*) as total, max(score) as best_score')
            ->groupBy('lesson_id')
            ->get()
            ->keyBy('lesson_id');

        return response()->json([
            'progress' => $progressRecords->map(function ($p) use ($attemptCounts) {
                $attempts = $attemptCounts->get($p->lesson_id);
                return [
                    'lesson_id'        => $p->lesson_id,
                    'lesson_title'     => $p->lesson?->title,
                    'best_score'       => $p->score,
                    'passed'           => $p->passed,
                    'total_attempts'   => $attempts?->total ?? $p->attempts,
                    'lesson_completed' => $p->lesson_completed,
                    'completed_at'     => $p->completed_at?->toIso8601String(),
                ];
            }),
        ]);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function formatAttemptResponse(Quiz $quiz, Lesson $lesson, QuizAttempt $attempt, $student): JsonResponse
    {
        // Load the specific questions for this attempt
        $questions = \App\Models\QuizQuestion::whereIn('id', $attempt->selected_question_ids)
            ->get()
            ->sortBy(fn($q) => array_search($q->id, $attempt->selected_question_ids))
            ->values();

        // Student's overall progress for this lesson
        $progress = StudentProgress::where('student_id', $student->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        $totalAttempts = QuizAttempt::where('student_id', $student->id)
            ->where('quiz_id', $quiz->id)
            ->whereNotNull('submitted_at')
            ->count();

        return response()->json([
            'attempt' => [
                'id'          => $attempt->id,
                'started_at'  => $attempt->started_at->toIso8601String(),
                'is_new'      => $attempt->wasRecentlyCreated,
            ],
            'quiz' => [
                'id'                   => $quiz->id,
                'type'                 => $quiz->type,
                'lesson_id'            => $lesson->id,
                'lesson_title'         => $lesson->title,
                'questions_per_attempt'=> count($attempt->selected_question_ids),
                'pass_mark'            => self::PASS_MARK,
                // Questions WITHOUT correct_answer (revealed after submit)
                'questions' => $questions->map(fn($q) => [
                    'id'       => $q->id,
                    'question' => $q->question,
                    'options'  => $q->options, // ["option A", "option B", "option C", "option D"]
                    'order'    => $q->order,
                ]),
            ],
            'progress' => $progress ? [
                'best_score'       => $progress->score,
                'passed'           => $progress->passed,
                'lesson_completed' => $progress->lesson_completed,
                'total_attempts'   => $totalAttempts,
            ] : [
                'best_score'       => null,
                'passed'           => false,
                'lesson_completed' => false,
                'total_attempts'   => 0,
            ],
        ]);
    }

    private function isEnrolled($student, Lesson $lesson): bool
    {
        if ($lesson->is_assessment) {
            return true; // assessment lessons bypass enrollment
        }

        return $student->enrolledUnits()
            ->where('unit_id', $lesson->unit_id)
            ->where('status', 'active')
            ->exists();
    }

    private function isLessonUnlocked(int $studentId, Lesson $lesson): bool
    {
        if ($lesson->is_assessment) {
            return true;
        }

        // Is it the first lesson in the unit?
        $isFirst = Lesson::where('unit_id', $lesson->unit_id)
            ->where('order', '<', $lesson->order)
            ->where('is_active', true)
            ->doesntExist();

        if ($isFirst) {
            return true;
        }

        // Check previous lesson's quiz was passed
        $previousLesson = Lesson::where('unit_id', $lesson->unit_id)
            ->where('order', '<', $lesson->order)
            ->where('is_active', true)
            ->orderByDesc('order')
            ->first();

        if (!$previousLesson) {
            return true;
        }

        return StudentProgress::where('student_id', $studentId)
            ->where('lesson_id', $previousLesson->id)
            ->where('passed', true)
            ->exists();
    }
}
