<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\Level;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds real titles and PDF URLs for the A1 level lessons.
 *
 * A1 structure: 3 units × 12 lessons = 36 lessons total
 * PDFs stored in storage/app/public/lessons/ and served via /storage/lessons/
 *
 * Run:  php artisan db:seed --class=A1LessonDataSeeder
 */
class A1LessonDataSeeder extends Seeder
{
    /**
     * Lesson data keyed by position within A1.
     * unit  = unit order within A1 (1, 2, or 3)
     * order = position within the unit (1–12)
     *
     * Lessons 1–9 have PDFs uploaded. Rest: pdf_url = null until uploaded.
     * Note: lesson 34 in the user list was duplicated; second entry = lesson 35.
     */
    private array $lessons = [
        // ── Unit 1 (Lessons 1–12) ────────────────────────────────────────────
        ['unit' => 1, 'order' => 1,  'title' => 'Foundations A-I',                  'pdf' => 'lesson-a1-1.pdf'],
        ['unit' => 1, 'order' => 2,  'title' => 'Completing the Alphabet & Vowels', 'pdf' => 'lesson-a1-2.pdf'],
        ['unit' => 1, 'order' => 3,  'title' => 'Numbers Adventure',                'pdf' => 'lesson-a1-3.pdf'],
        ['unit' => 1, 'order' => 4,  'title' => 'Digraphs',                         'pdf' => 'lesson-a1-4.pdf'],
        ['unit' => 1, 'order' => 5,  'title' => 'Colors',                           'pdf' => 'lesson-a1-5.pdf'],
        ['unit' => 1, 'order' => 6,  'title' => 'Superhero Mission',                'pdf' => 'lesson-a1-6.pdf'],
        ['unit' => 1, 'order' => 7,  'title' => 'Greetings',                        'pdf' => 'lesson-a1-7.pdf'],
        ['unit' => 1, 'order' => 8,  'title' => 'Parts of the Body',                'pdf' => 'lesson-a1-8.pdf'],
        ['unit' => 1, 'order' => 9,  'title' => 'Final Review & Test',              'pdf' => 'lesson-a1-9.pdf'],
        ['unit' => 1, 'order' => 10, 'title' => 'Nice to Meet You',                 'pdf' => null],
        ['unit' => 1, 'order' => 11, 'title' => 'Numbers and Things',               'pdf' => null],
        ['unit' => 1, 'order' => 12, 'title' => 'Countries & Nationalities',        'pdf' => null],

        // ── Unit 2 (Lessons 13–24) ───────────────────────────────────────────
        ['unit' => 2, 'order' => 1,  'title' => 'Review Session',                   'pdf' => null],
        ['unit' => 2, 'order' => 2,  'title' => 'Jobs & Numbers',                   'pdf' => null],
        ['unit' => 2, 'order' => 3,  'title' => 'My Wonderful Family',              'pdf' => null],
        ['unit' => 2, 'order' => 4,  'title' => 'Describing People',                'pdf' => null],
        ['unit' => 2, 'order' => 5,  'title' => 'Review 2: The Superstar',          'pdf' => null],
        ['unit' => 2, 'order' => 6,  'title' => "What's in Your Bag?",              'pdf' => null],
        ['unit' => 2, 'order' => 7,  'title' => 'Food, Drinks & Likes',             'pdf' => null],
        ['unit' => 2, 'order' => 8,  'title' => 'iFluent Reading Club',             'pdf' => null],
        ['unit' => 2, 'order' => 9,  'title' => 'Time & Days',                      'pdf' => null],
        ['unit' => 2, 'order' => 10, 'title' => 'The Big Review Challenge',         'pdf' => null],
        ['unit' => 2, 'order' => 11, 'title' => 'My Daily Routine',                 'pdf' => null],
        ['unit' => 2, 'order' => 12, 'title' => 'His & Her Routine',                'pdf' => null],

        // ── Unit 3 (Lessons 25–36) ───────────────────────────────────────────
        ['unit' => 3, 'order' => 1,  'title' => 'How Often? My Schedule',           'pdf' => null],
        ['unit' => 3, 'order' => 2,  'title' => 'Routine Mastery',                  'pdf' => null],
        ['unit' => 3, 'order' => 3,  'title' => 'My Sweet Home',                    'pdf' => null],
        ['unit' => 3, 'order' => 4,  'title' => 'Where is My House?',               'pdf' => null],
        ['unit' => 3, 'order' => 5,  'title' => 'Reading Club 2',                   'pdf' => null],
        ['unit' => 3, 'order' => 6,  'title' => 'Can I Order, Please?',             'pdf' => null],
        ['unit' => 3, 'order' => 7,  'title' => 'Master Review 4',                  'pdf' => null],
        ['unit' => 3, 'order' => 8,  'title' => 'Action Report',                    'pdf' => null],
        ['unit' => 3, 'order' => 9,  'title' => 'Scene Investigator',               'pdf' => null],
        ['unit' => 3, 'order' => 10, 'title' => 'The Past Adventure',               'pdf' => null],
        ['unit' => 3, 'order' => 11, 'title' => 'Reading Mastery',                  'pdf' => null],
        ['unit' => 3, 'order' => 12, 'title' => 'Review Session',                   'pdf' => null],
    ];

    public function run(): void
    {
        $level = Level::where('code', 'A1')->firstOrFail();
        $baseUrl = rtrim(config('app.url'), '/') . '/storage/lessons/';

        $units = $level->units()->orderBy('order')->get()->keyBy('order');

        $updated = 0;

        foreach ($this->lessons as $data) {
            $unit = $units->get($data['unit']);

            if (!$unit) {
                $this->command->warn("Unit {$data['unit']} not found for A1");
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
                'pdf_url' => $data['pdf'] ? $baseUrl . $data['pdf'] : null,
            ]);

            $updated++;
        }

        $this->command->info("✅  A1: Updated {$updated} lessons with titles and PDF URLs.");
    }
}
