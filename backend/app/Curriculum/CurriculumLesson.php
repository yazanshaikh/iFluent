<?php

namespace App\Curriculum;

/**
 * Base class for every lesson in every level.
 *
 * Each concrete lesson (e.g. App\Curriculum\A1\Lesson1) extends this class
 * and overrides the methods it needs.
 *
 * Content (title, pre-activity, quiz) is populated when the PDF arrives.
 * PDF URL is stored in the `curriculum_pdfs` DB table (admin can update it).
 */
abstract class CurriculumLesson
{
    // ── Identity ─────────────────────────────────────────────────────────────────

    /** e.g. 'A1' */
    abstract public static function levelCode(): string;

    /** 1-based lesson number within the level */
    abstract public static function lessonNumber(): int;

    /**
     * Display title shown to the student.
     * Returns null until filled in with the PDF content.
     */
    public static function title(): ?string
    {
        return null;
    }

    // ── Pre-lesson Activity ───────────────────────────────────────────────────────

    /**
     * Activity the student completes BEFORE the live session.
     *
     * Structure (example — vocabulary match):
     * [
     *   'type'         => 'vocabulary_match',   // vocabulary_match | fill_blank | flashcards | multiple_choice
     *   'instructions' => 'Match the word to its meaning.',
     *   'items'        => [
     *     ['word' => 'Apple', 'match' => 'تفاحة'],
     *   ],
     * ]
     *
     * Returns empty array until content is added.
     */
    public static function preActivity(): array
    {
        return [];
    }

    // ── Post-lesson Quiz ──────────────────────────────────────────────────────────

    /**
     * Quiz taken AFTER the live session.
     * Once the student passes (score >= pass_score), quiz_locked = true forever.
     *
     * Structure:
     * [
     *   'pass_score' => 60,           // minimum % to pass
     *   'questions'  => [
     *     [
     *       'text'    => 'What is the plural of "cat"?',
     *       'type'    => 'multiple_choice',    // multiple_choice | true_false | fill_blank
     *       'options' => ['cats', 'cates', 'cat', 'catss'],
     *       'answer'  => 'cats',
     *     ],
     *   ],
     * ]
     *
     * Returns stub structure until content is added.
     */
    public static function quiz(): array
    {
        return [
            'pass_score' => 60,
            'questions'  => [],
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    /** Unique key used to look up the PDF in `curriculum_pdfs` table. */
    public static function pdfKey(): array
    {
        return [
            'level_code'    => static::levelCode(),
            'lesson_number' => static::lessonNumber(),
        ];
    }

    /** Human-readable identifier for logging/debugging. */
    public static function identifier(): string
    {
        return static::levelCode() . ':Lesson' . static::lessonNumber();
    }
}
