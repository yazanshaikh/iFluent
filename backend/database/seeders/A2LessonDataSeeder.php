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
        ['unit' => 1, 'order' => 1,  'title' => 'Personal Info & Introductions',          'pdf' => 'lesson-a2-37.pdf'],
        ['unit' => 1, 'order' => 2,  'title' => 'Descriptions & Personality',             'pdf' => 'lesson-a2-38.pdf'],
        ['unit' => 1, 'order' => 3,  'title' => 'Family & Relationships',                 'pdf' => 'lesson-a2-39.pdf'],
        ['unit' => 1, 'order' => 4,  'title' => 'Jobs',                                   'pdf' => 'lesson-a2-40.pdf'],
        ['unit' => 1, 'order' => 5,  'title' => 'Daily Routines & Time Expressions',      'pdf' => 'lesson-a2-41.pdf'],
        ['unit' => 1, 'order' => 6,  'title' => 'Present Simple — Negative & Questions',  'pdf' => 'lesson-a2-42.pdf'],
        ['unit' => 1, 'order' => 7,  'title' => 'Hobbies',                                'pdf' => 'lesson-a2-43.pdf'],
        ['unit' => 1, 'order' => 8,  'title' => 'Expressing Habits with Verb+ing',        'pdf' => 'lesson-a2-44.pdf'],
        ['unit' => 1, 'order' => 9,  'title' => 'Conjunctions',                           'pdf' => 'lesson-a2-45.pdf'],
        ['unit' => 1, 'order' => 10, 'title' => 'Review 1–9',                             'pdf' => 'lesson-a2-46.pdf'],
        ['unit' => 1, 'order' => 11, 'title' => 'Descriptive Prepositions of Place',      'pdf' => 'lesson-a2-47.pdf'],
        ['unit' => 1, 'order' => 12, 'title' => 'Place Description',                      'pdf' => 'lesson-a2-48.pdf'],

        // ── Unit 2 (Lessons 49–60) ───────────────────────────────────────────
        ['unit' => 2, 'order' => 1,  'title' => 'My Home',                                'pdf' => 'lesson-a2-49.pdf'],
        ['unit' => 2, 'order' => 2,  'title' => 'My Home 2',                              'pdf' => 'lesson-a2-50.pdf'],
        ['unit' => 2, 'order' => 3,  'title' => 'Life Skills & Daily Scenarios',          'pdf' => 'lesson-a2-51.pdf'],
        ['unit' => 2, 'order' => 4,  'title' => 'Polite Requests',                        'pdf' => 'lesson-a2-52.pdf'],
        ['unit' => 2, 'order' => 5,  'title' => 'Countable vs Uncountable Nouns',         'pdf' => 'lesson-a2-53.pdf'],
        ['unit' => 2, 'order' => 6,  'title' => 'Quantifiers — Some, Any, Much, Many',   'pdf' => 'lesson-a2-54.pdf'],
        ['unit' => 2, 'order' => 7,  'title' => 'Review 11–18',                           'pdf' => 'lesson-a2-55.pdf'],
        ['unit' => 2, 'order' => 8,  'title' => 'Past Simple',                            'pdf' => 'lesson-a2-56.pdf'],
        ['unit' => 2, 'order' => 9,  'title' => 'Irregular Past Verbs',                   'pdf' => 'lesson-a2-57.pdf'],
        ['unit' => 2, 'order' => 10, 'title' => 'Past Experiences',                       'pdf' => 'lesson-a2-58.pdf'],
        ['unit' => 2, 'order' => 11, 'title' => 'WH Questions',                           'pdf' => 'lesson-a2-59.pdf'],
        ['unit' => 2, 'order' => 12, 'title' => 'Review 20–24',                           'pdf' => 'lesson-a2-60.pdf'],

        // ── Unit 3 (Lessons 61–72) ───────────────────────────────────────────
        ['unit' => 3, 'order' => 1,  'title' => 'Talking About the Future',               'pdf' => 'lesson-a2-61.pdf'],
        ['unit' => 3, 'order' => 2,  'title' => 'Yesterday and Tomorrow',                 'pdf' => 'lesson-a2-62.pdf'],
        ['unit' => 3, 'order' => 3,  'title' => 'Review — Past & Future',                 'pdf' => 'lesson-a2-63.pdf'],
        ['unit' => 3, 'order' => 4,  'title' => 'Making Suggestions',                     'pdf' => 'lesson-a2-64.pdf'],
        ['unit' => 3, 'order' => 5,  'title' => 'Directions',                             'pdf' => 'lesson-a2-65.pdf'],
        ['unit' => 3, 'order' => 6,  'title' => 'In the City',                            'pdf' => 'lesson-a2-66.pdf'],
        ['unit' => 3, 'order' => 7,  'title' => 'Ordering Food',                          'pdf' => 'lesson-a2-67.pdf'],
        ['unit' => 3, 'order' => 8,  'title' => 'Reading Mastery',                        'pdf' => 'lesson-a2-68.pdf'],
        ['unit' => 3, 'order' => 9,  'title' => 'Polite Agreement',                       'pdf' => 'lesson-a2-69.pdf'],
        ['unit' => 3, 'order' => 10, 'title' => 'Talking About the Weather',              'pdf' => 'lesson-a2-70.pdf'],
        ['unit' => 3, 'order' => 11, 'title' => 'School Subjects',                        'pdf' => 'lesson-a2-71.pdf'],
        ['unit' => 3, 'order' => 12, 'title' => 'General Review A2',                      'pdf' => 'lesson-a2-72.pdf'],
    ];

    public function run(): void
    {
        $level   = Level::where('code', 'A2')->firstOrFail();
        $units   = Unit::where('level_id', $level->id)->orderBy('order')->get()->keyBy('order');
        $baseUrl = rtrim(config('app.url'), '/') . '/storage/lessons/';

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

            $lesson->update([
                'title'   => $data['title'],
                'pdf_url' => isset($data['pdf']) ? $baseUrl . $data['pdf'] : null,
            ]);
            $updated++;
        }

        $this->command->info("✅  A2: Updated {$updated} lessons with titles and PDF URLs.");
    }
}
