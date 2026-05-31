<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\Level;
use App\Models\Unit;
use Illuminate\Database\Seeder;

/**
 * Seeds real titles for A2 level lessons (37–72).
 * A2 structure: 3 units × 12 lessons = 36 lessons total
 * PDFs not yet uploaded — pdf_url stays null.
 *
 * Run:  php artisan db:seed --class=A2LessonDataSeeder
 */
class A2LessonDataSeeder extends Seeder
{
    private array $lessons = [
        // ── Unit 1 (Lessons 37–48) ───────────────────────────────────────────
        ['unit' => 1, 'order' => 1,  'title' => 'Personal Info & Introductions'],
        ['unit' => 1, 'order' => 2,  'title' => 'Descriptions & Personality'],
        ['unit' => 1, 'order' => 3,  'title' => 'Family & Relationships'],
        ['unit' => 1, 'order' => 4,  'title' => 'Jobs'],
        ['unit' => 1, 'order' => 5,  'title' => 'Daily Routines & Time Expressions'],
        ['unit' => 1, 'order' => 6,  'title' => 'Present Simple — Negative & Questions'],
        ['unit' => 1, 'order' => 7,  'title' => 'Hobbies'],
        ['unit' => 1, 'order' => 8,  'title' => 'Expressing Habits with Verb+ing'],
        ['unit' => 1, 'order' => 9,  'title' => 'Conjunctions'],
        ['unit' => 1, 'order' => 10, 'title' => 'Review 1–9'],
        ['unit' => 1, 'order' => 11, 'title' => 'Descriptive Prepositions of Place'],
        ['unit' => 1, 'order' => 12, 'title' => 'Place Description'],

        // ── Unit 2 (Lessons 49–60) ───────────────────────────────────────────
        ['unit' => 2, 'order' => 1,  'title' => 'My Home'],
        ['unit' => 2, 'order' => 2,  'title' => 'My Home 2'],
        ['unit' => 2, 'order' => 3,  'title' => 'Life Skills & Daily Scenarios'],
        ['unit' => 2, 'order' => 4,  'title' => 'Polite Requests'],
        ['unit' => 2, 'order' => 5,  'title' => 'Countable vs Uncountable Nouns'],
        ['unit' => 2, 'order' => 6,  'title' => 'Quantifiers — Some, Any, Much, Many'],
        ['unit' => 2, 'order' => 7,  'title' => 'Review 11–18'],
        ['unit' => 2, 'order' => 8,  'title' => 'Past Simple'],
        ['unit' => 2, 'order' => 9,  'title' => 'Irregular Past Verbs'],
        ['unit' => 2, 'order' => 10, 'title' => 'Past Experiences'],
        ['unit' => 2, 'order' => 11, 'title' => 'WH Questions'],
        ['unit' => 2, 'order' => 12, 'title' => 'Review 20–24'],

        // ── Unit 3 (Lessons 61–72) ───────────────────────────────────────────
        ['unit' => 3, 'order' => 1,  'title' => 'Talking About the Future'],
        ['unit' => 3, 'order' => 2,  'title' => 'Yesterday and Tomorrow'],
        ['unit' => 3, 'order' => 3,  'title' => 'Review — Past & Future'],
        ['unit' => 3, 'order' => 4,  'title' => 'Making Suggestions'],
        ['unit' => 3, 'order' => 5,  'title' => 'Directions'],
        ['unit' => 3, 'order' => 6,  'title' => 'In the City'],
        ['unit' => 3, 'order' => 7,  'title' => 'Ordering Food'],
        ['unit' => 3, 'order' => 8,  'title' => 'Reading Mastery'],
        ['unit' => 3, 'order' => 9,  'title' => 'Polite Agreement'],
        ['unit' => 3, 'order' => 10, 'title' => 'Talking About the Weather'],
        ['unit' => 3, 'order' => 11, 'title' => 'School Subjects'],
        ['unit' => 3, 'order' => 12, 'title' => 'General Review A2'],
    ];

    public function run(): void
    {
        $level = Level::where('code', 'A2')->firstOrFail();
        $units = Unit::where('level_id', $level->id)->orderBy('order')->get()->keyBy('order');

        $updated = 0;

        foreach ($this->lessons as $data) {
            $unit = $units->get($data['unit']);
            if (!$unit) {
                $this->command->warn("Unit {$data['unit']} not found for A2");
                continue;
            }

            $lesson = Lesson::where('unit_id', $unit->id)
                ->where('order', $data['order'])
                ->first();

            if (!$lesson) {
                $this->command->warn("Lesson unit={$data['unit']} order={$data['order']} not found");
                continue;
            }

            $lesson->update(['title' => $data['title']]);
            $updated++;
        }

        $this->command->info("✅  A2: Updated {$updated} lessons with real titles.");
    }
}
