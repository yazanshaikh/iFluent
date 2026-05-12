<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\Lesson;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    /**
     * Full curriculum structure:
     *
     *  A1  — Foundation                  3 units × 12 = 36 lessons
     *  A2  — Advanced Foundation         3 units × 12 = 36 lessons
     *  B1  — Understanding & Confidence  5 units × 12 = 60 lessons
     *  B2  — Fluency & Expansion         5 units × 12 = 60 lessons
     *  FT  — Free Talking / Mastery      5 units × 12 = 60 lessons
     *                                             Total = 252 lessons
     */
    private array $levels = [
        [
            'code'          => 'A1',
            'name'          => 'مرحلة التأسيس',
            'name_en'       => 'Foundation',
            'description'   => 'مرحلة البداية لتعلم اللغة الإنجليزية من الصفر.',
            'order'         => 1,
            'total_units'   => 3,
            'total_lessons' => 36,
        ],
        [
            'code'          => 'A2',
            'name'          => 'مرحلة البناء التأسيسي المتقدم',
            'name_en'       => 'Advanced Foundation',
            'description'   => 'توسيع المفردات وتعزيز القواعد الأساسية.',
            'order'         => 2,
            'total_units'   => 3,
            'total_lessons' => 36,
        ],
        [
            'code'          => 'B1',
            'name'          => 'مرحلة الفهم والثقة',
            'name_en'       => 'Understanding & Confidence',
            'description'   => 'بناء الثقة في الاستخدام اليومي للغة.',
            'order'         => 3,
            'total_units'   => 5,
            'total_lessons' => 60,
        ],
        [
            'code'          => 'B2',
            'name'          => 'مرحلة الطلاقة والتوسع',
            'name_en'       => 'Fluency & Expansion',
            'description'   => 'تطوير الطلاقة والتعبير الأكاديمي والمهني.',
            'order'         => 4,
            'total_units'   => 5,
            'total_lessons' => 60,
        ],
        [
            'code'          => 'FT',
            'name'          => 'الإتقان اللغوي والمحادثة الحرة',
            'name_en'       => 'Free Talking & Mastery',
            'description'   => 'المحادثة الحرة والإتقان الكامل للغة.',
            'order'         => 5,
            'total_units'   => 5,
            'total_lessons' => 60,
        ],
    ];

    public function run(): void
    {
        $totalLessons = 0;

        foreach ($this->levels as $levelData) {
            $level = Level::create($levelData);

            for ($unitOrder = 1; $unitOrder <= $levelData['total_units']; $unitOrder++) {
                $unit = Unit::create([
                    'level_id'     => $level->id,
                    'name'         => "الوحدة {$this->toArabicOrdinal($unitOrder)}",
                    'name_en'      => "Unit {$unitOrder}",
                    'order'        => $unitOrder,
                    'lesson_count' => 12,
                    'has_end_test' => true,
                ]);

                for ($lessonOrder = 1; $lessonOrder <= 12; $lessonOrder++) {
                    Lesson::create([
                        'level_id'    => $level->id,
                        'unit_id'     => $unit->id,
                        'title'       => "درس {$lessonOrder} — {$unit->name_en}",
                        'description' => null,  // filled later via admin panel
                        'order'       => $lessonOrder,
                        // nearpod_lesson_id and nearpod_url are null until admin fills them
                    ]);

                    $totalLessons++;
                }
            }

            $this->command->info(
                "✅  {$level->code} ({$level->name_en}): "
                . "{$levelData['total_units']} units × 12 = "
                . ($levelData['total_units'] * 12) . " lessons"
            );
        }

        $this->command->info("─────────────────────────────────────");
        $this->command->info("✅  Total lessons created: {$totalLessons}");

        // ── Assessment lessons — 1 per level, no unit ─────────────────────────
        $this->command->info("");
        $this->command->info("Seeding assessment lessons...");

        foreach (Level::orderBy('order')->get() as $level) {
            Lesson::create([
                'level_id'      => $level->id,
                'unit_id'       => null,  // assessment lessons have no unit
                'title'         => "حصة التقييم — {$level->name_en} ({$level->code})",
                'description'   => "حصة تقييمية لقياس مستوى الطالب قبل الاشتراك في مستوى {$level->name}",
                'order'         => 0,     // 0 = not part of a unit sequence
                'is_assessment' => true,
                'is_active'     => true,
            ]);
            $this->command->info("  ✅  Assessment lesson → [{$level->code}] {$level->name_en}");
        }
        $this->command->info("─────────────────────────────────────");
        $this->command->info("✅  5 assessment lessons created.");
    }

    // ─── Arabic Ordinals ──────────────────────────────────────────────────────

    private function toArabicOrdinal(int $n): string
    {
        return match ($n) {
            1  => 'الأولى',
            2  => 'الثانية',
            3  => 'الثالثة',
            4  => 'الرابعة',
            5  => 'الخامسة',
            6  => 'السادسة',
            7  => 'السابعة',
            8  => 'الثامنة',
            9  => 'التاسعة',
            10 => 'العاشرة',
            default => "{$n}"
        };
    }
}
