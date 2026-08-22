<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\Level;
use Illuminate\Database\Seeder;

/**
 * Interactive activity (Wordwall) links for lessons.
 *
 * These used to live only in a developer's local database — there is no CRM
 * screen or API that writes lessons.activity_url, so production shipped with
 * none of them. Keeping them here makes the data versioned and repeatable.
 *
 * Matching deliberately avoids lesson IDs (they differ between environments):
 *   - regular lessons  → level code + unit order + lesson order
 *   - assessment lessons (no unit, order 0) → title + is_assessment
 *
 * Idempotent: re-running only rewrites the same URLs.
 *
 * Run:  php artisan db:seed --class=LessonActivityUrlSeeder --force
 */
class LessonActivityUrlSeeder extends Seeder
{
    /** level code + unit order + lesson order → activity URL */
    private array $lessons = [
        ['level' => 'A1', 'unit' => 1, 'order' => 4, 'url' => 'https://wordwall.net/play/114825/724/328'],
        ['level' => 'A1', 'unit' => 1, 'order' => 5, 'url' => 'https://wordwall.net/play/114245/231/290'],
        ['level' => 'A1', 'unit' => 1, 'order' => 6, 'url' => 'https://wordwall.net/play/114244/995/683'],
        ['level' => 'A1', 'unit' => 1, 'order' => 7, 'url' => 'https://wordwall.net/play/114245/547/602'],
        ['level' => 'A1', 'unit' => 1, 'order' => 8, 'url' => 'https://wordwall.net/play/114245/573/999'],
        ['level' => 'A1', 'unit' => 1, 'order' => 9, 'url' => 'https://wordwall.net/play/114245/045/605'],
        ['level' => 'A1', 'unit' => 1, 'order' => 10, 'url' => 'https://wordwall.net/play/114381/864/486'],
        ['level' => 'A1', 'unit' => 1, 'order' => 11, 'url' => 'https://wordwall.net/play/114382/673/520'],
        ['level' => 'A1', 'unit' => 1, 'order' => 12, 'url' => 'https://wordwall.net/play/114382/898/944'],
        ['level' => 'A1', 'unit' => 2, 'order' => 1, 'url' => 'https://wordwall.net/play/114383/242/229'],
        ['level' => 'A1', 'unit' => 2, 'order' => 2, 'url' => 'https://wordwall.net/play/114384/192/642'],
        ['level' => 'A1', 'unit' => 2, 'order' => 3, 'url' => 'https://wordwall.net/play/114384/676/463'],
        ['level' => 'A1', 'unit' => 2, 'order' => 4, 'url' => 'https://wordwall.net/play/114384/843/207'],
        ['level' => 'A1', 'unit' => 2, 'order' => 5, 'url' => 'https://wordwall.net/play/114384/964/216'],
        ['level' => 'A1', 'unit' => 2, 'order' => 6, 'url' => 'https://wordwall.net/play/114385/452/990'],
        ['level' => 'A1', 'unit' => 2, 'order' => 7, 'url' => 'https://wordwall.net/play/114387/575/679'],
        ['level' => 'A1', 'unit' => 2, 'order' => 8, 'url' => 'https://wordwall.net/play/114387/858/230'],
        ['level' => 'A1', 'unit' => 2, 'order' => 9, 'url' => 'https://wordwall.net/play/114388/128/642'],
        ['level' => 'A1', 'unit' => 2, 'order' => 10, 'url' => 'https://wordwall.net/play/114388/437/525'],
        ['level' => 'A1', 'unit' => 2, 'order' => 11, 'url' => 'https://wordwall.net/play/114389/056/491'],
        ['level' => 'A1', 'unit' => 2, 'order' => 12, 'url' => 'https://wordwall.net/play/114388/437/126'],
        ['level' => 'A1', 'unit' => 3, 'order' => 1, 'url' => 'https://wordwall.net/play/114389/056/137'],
        ['level' => 'A1', 'unit' => 3, 'order' => 2, 'url' => 'https://wordwall.net/resource/114389162'],
        ['level' => 'A1', 'unit' => 3, 'order' => 3, 'url' => 'https://wordwall.net/play/114389/248/956'],
        ['level' => 'A1', 'unit' => 3, 'order' => 4, 'url' => 'https://wordwall.net/resource/114392125'],
        ['level' => 'A1', 'unit' => 3, 'order' => 5, 'url' => 'https://wordwall.net/resource/114392345'],
        ['level' => 'A1', 'unit' => 3, 'order' => 6, 'url' => 'https://wordwall.net/play/114392/345/120'],
        ['level' => 'A1', 'unit' => 3, 'order' => 7, 'url' => 'https://wordwall.net/play/114392/702/395'],
        ['level' => 'A1', 'unit' => 3, 'order' => 8, 'url' => 'https://wordwall.net/play/114393/189/652'],
        ['level' => 'A1', 'unit' => 3, 'order' => 9, 'url' => 'https://wordwall.net/play/114393/355/623'],
        ['level' => 'A1', 'unit' => 3, 'order' => 10, 'url' => 'https://wordwall.net/resource/114393599'],
        ['level' => 'A1', 'unit' => 3, 'order' => 12, 'url' => 'https://wordwall.net/play/114428/957/679'],
        ['level' => 'A2', 'unit' => 1, 'order' => 1, 'url' => 'https://wordwall.net/play/114434/772/949'],
        ['level' => 'A2', 'unit' => 1, 'order' => 2, 'url' => 'https://wordwall.net/play/114435/464/456'],
        ['level' => 'A2', 'unit' => 1, 'order' => 3, 'url' => 'https://wordwall.net/play/114435/592/242'],
        ['level' => 'A2', 'unit' => 1, 'order' => 4, 'url' => 'https://wordwall.net/play/114435/839/227'],
        ['level' => 'A2', 'unit' => 1, 'order' => 5, 'url' => 'https://wordwall.net/play/114436/707/517'],
        ['level' => 'A2', 'unit' => 1, 'order' => 6, 'url' => 'https://wordwall.net/play/114437/191/401'],
        ['level' => 'A2', 'unit' => 1, 'order' => 7, 'url' => 'https://wordwall.net/play/114437/552/388'],
        ['level' => 'A2', 'unit' => 1, 'order' => 8, 'url' => 'https://wordwall.net/play/114437/811/100'],
        ['level' => 'A2', 'unit' => 1, 'order' => 9, 'url' => 'https://wordwall.net/play/114460/871/906'],
        ['level' => 'A2', 'unit' => 1, 'order' => 10, 'url' => 'https://wordwall.net/play/114461/028/399'],
        ['level' => 'A2', 'unit' => 1, 'order' => 11, 'url' => 'https://wordwall.net/play/114461/666/913'],
        ['level' => 'A2', 'unit' => 1, 'order' => 12, 'url' => 'https://wordwall.net/play/114462/050/632'],
        ['level' => 'A2', 'unit' => 2, 'order' => 1, 'url' => 'https://wordwall.net/play/114462/327/949'],
        ['level' => 'A2', 'unit' => 2, 'order' => 2, 'url' => 'https://wordwall.net/play/114462/510/800'],
        ['level' => 'A2', 'unit' => 2, 'order' => 3, 'url' => 'https://wordwall.net/play/114462/577/137'],
        ['level' => 'A2', 'unit' => 2, 'order' => 4, 'url' => 'https://wordwall.net/play/114462/703/678'],
        ['level' => 'A2', 'unit' => 2, 'order' => 5, 'url' => 'https://wordwall.net/play/114462/879/709'],
        ['level' => 'A2', 'unit' => 2, 'order' => 6, 'url' => 'https://wordwall.net/play/114463/051/328'],
        ['level' => 'A2', 'unit' => 2, 'order' => 7, 'url' => 'https://wordwall.net/play/114463/132/408'],
        ['level' => 'A2', 'unit' => 2, 'order' => 8, 'url' => 'https://wordwall.net/resource/114463200'],
        ['level' => 'A2', 'unit' => 2, 'order' => 9, 'url' => 'https://wordwall.net/play/114463/165/400'],
        ['level' => 'A2', 'unit' => 2, 'order' => 10, 'url' => 'https://wordwall.net/play/114463/262/621'],
        ['level' => 'A2', 'unit' => 2, 'order' => 11, 'url' => 'https://wordwall.net/play/114463/329/216'],
        ['level' => 'A2', 'unit' => 2, 'order' => 12, 'url' => 'https://wordwall.net/play/114463/431/859'],
        ['level' => 'A2', 'unit' => 3, 'order' => 1, 'url' => 'https://wordwall.net/play/114463/454/941'],
        ['level' => 'A2', 'unit' => 3, 'order' => 2, 'url' => 'https://wordwall.net/play/114463/520/478'],
        ['level' => 'A2', 'unit' => 3, 'order' => 3, 'url' => 'https://wordwall.net/play/114464/042/879'],
        ['level' => 'A2', 'unit' => 3, 'order' => 4, 'url' => 'https://wordwall.net/play/114464/073/639'],
        ['level' => 'A2', 'unit' => 3, 'order' => 5, 'url' => 'https://wordwall.net/play/114464/099/715'],
        ['level' => 'A2', 'unit' => 3, 'order' => 6, 'url' => 'https://wordwall.net/play/114464/183/632'],
        ['level' => 'A2', 'unit' => 3, 'order' => 7, 'url' => 'https://wordwall.net/play/114464/335/201'],
        ['level' => 'A2', 'unit' => 3, 'order' => 9, 'url' => 'https://wordwall.net/play/114464/382/405'],
        ['level' => 'A2', 'unit' => 3, 'order' => 10, 'url' => 'https://wordwall.net/play/114464/449/290'],
        ['level' => 'A2', 'unit' => 3, 'order' => 11, 'url' => 'https://wordwall.net/play/114464/476/229'],
        ['level' => 'A2', 'unit' => 3, 'order' => 12, 'url' => 'https://wordwall.net/play/114464/500/725'],
        ['level' => 'B1', 'unit' => 1, 'order' => 1, 'url' => 'https://wordwall.net/play/114634/611/929'],
        ['level' => 'B1', 'unit' => 1, 'order' => 2, 'url' => 'https://wordwall.net/play/114634/653/122'],
        ['level' => 'B1', 'unit' => 1, 'order' => 3, 'url' => 'https://wordwall.net/play/114634/683/343'],
        ['level' => 'B1', 'unit' => 1, 'order' => 4, 'url' => 'https://wordwall.net/play/114634/742/645'],
        ['level' => 'B1', 'unit' => 1, 'order' => 5, 'url' => 'https://wordwall.net/play/114634/774/562'],
        ['level' => 'B1', 'unit' => 1, 'order' => 6, 'url' => 'https://wordwall.net/play/114634/820/472'],
        ['level' => 'B1', 'unit' => 1, 'order' => 7, 'url' => 'https://wordwall.net/play/114634/868/161'],
        ['level' => 'B1', 'unit' => 1, 'order' => 8, 'url' => 'https://wordwall.net/play/114634/897/847'],
        ['level' => 'B1', 'unit' => 1, 'order' => 9, 'url' => 'https://wordwall.net/play/114634/923/616'],
        ['level' => 'B1', 'unit' => 1, 'order' => 10, 'url' => 'https://wordwall.net/play/114634/940/234'],
        ['level' => 'B1', 'unit' => 1, 'order' => 11, 'url' => 'https://wordwall.net/play/114635/024/488'],
        ['level' => 'B1', 'unit' => 1, 'order' => 12, 'url' => 'https://wordwall.net/play/114635/060/517'],
        ['level' => 'B1', 'unit' => 2, 'order' => 1, 'url' => 'https://wordwall.net/play/114635/083/220'],
        ['level' => 'B1', 'unit' => 2, 'order' => 2, 'url' => 'https://wordwall.net/play/114635/115/776'],
        ['level' => 'B1', 'unit' => 2, 'order' => 3, 'url' => 'https://wordwall.net/play/114635/266/289'],
        ['level' => 'B1', 'unit' => 2, 'order' => 4, 'url' => 'https://wordwall.net/play/114635/378/935'],
        ['level' => 'B1', 'unit' => 2, 'order' => 5, 'url' => 'https://wordwall.net/play/114635/426/302'],
        ['level' => 'B1', 'unit' => 2, 'order' => 6, 'url' => 'https://wordwall.net/play/114635/453/301'],
        ['level' => 'B1', 'unit' => 2, 'order' => 7, 'url' => 'https://wordwall.net/play/114635/498/505'],
        ['level' => 'B1', 'unit' => 2, 'order' => 8, 'url' => 'https://wordwall.net/play/114635/536/562'],
        ['level' => 'B1', 'unit' => 2, 'order' => 9, 'url' => 'https://wordwall.net/play/114635/552/551'],
        ['level' => 'B1', 'unit' => 2, 'order' => 10, 'url' => 'https://wordwall.net/play/114635/572/248'],
        ['level' => 'B1', 'unit' => 2, 'order' => 11, 'url' => 'https://wordwall.net/play/114635/598/881'],
        ['level' => 'B1', 'unit' => 2, 'order' => 12, 'url' => 'https://wordwall.net/play/114635/623/763'],
    ];

    /** assessment lessons matched by title */
    private array $assessments = [
        ['level' => 'A1', 'title' => 'Greetings — Beginner', 'url' => 'https://wordwall.net/play/114276/017/809'],
        ['level' => 'A2', 'title' => 'Making an Order',      'url' => 'https://wordwall.net/play/114276/145/316'],
        ['level' => 'B1', 'title' => 'WH Questions',         'url' => 'https://wordwall.net/play/114276/679/142'],
    ];

    public function run(): void
    {
        $updated = 0;
        $missing = [];

        foreach ($this->lessons as $row) {
            $level = Level::where('code', $row['level'])->first();

            $lesson = $level
                ? Lesson::where('order', $row['order'])
                    ->whereHas('unit', fn ($q) => $q
                        ->where('level_id', $level->id)
                        ->where('order', $row['unit']))
                    ->first()
                : null;

            if (!$lesson) {
                $missing[] = "{$row['level']} u{$row['unit']}/l{$row['order']}";
                continue;
            }

            $lesson->update(['activity_url' => $row['url']]);
            $updated++;
        }

        foreach ($this->assessments as $row) {
            $lesson = Lesson::where('is_assessment', true)
                ->where('title', $row['title'])
                ->first();

            // Titles drift between environments (em-dash vs hyphen, rewording),
            // so fall back to the level — each level holds one assessment lesson.
            if (!$lesson) {
                $level = Level::where('code', $row['level'])->first();

                $lesson = $level
                    ? Lesson::where('is_assessment', true)
                        ->where('level_id', $level->id)
                        ->orderBy('id')
                        ->first()
                    : null;
            }

            if (!$lesson) {
                $missing[] = "assessment: {$row['level']} / {$row['title']}";
                continue;
            }

            $lesson->update(['activity_url' => $row['url']]);
            $updated++;
        }

        $this->command->info("✅  Activity URLs set on {$updated} lessons.");

        if ($missing) {
            $this->command->warn('⚠️  No matching lesson for: ' . implode(', ', $missing));
        }
    }
}
