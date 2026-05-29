<?php

namespace App\Curriculum\A1;

use App\Curriculum\CurriculumLesson;

class Lesson36 extends CurriculumLesson
{
    public static function levelCode(): string { return 'A1'; }

    public static function lessonNumber(): int { return 36; }

    // ── Content will be filled in when the PDF is reviewed ───────────────────

    // public static function title(): ?string
    // {
    //     return 'Lesson title here';
    // }

    // public static function preActivity(): array
    // {
    //     return [
    //         'type'         => 'vocabulary_match',
    //         'instructions' => 'Match the word to its meaning.',
    //         'items'        => [],
    //     ];
    // }

    // public static function quiz(): array
    // {
    //     return [
    //         'pass_score' => 60,
    //         'questions'  => [],
    //     ];
    // }
}
