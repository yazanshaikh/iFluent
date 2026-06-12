<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Illuminate\Console\Command;

/**
 * One-time (and safe to re-run) backfill: enroll every active subscriber in the
 * units covered by their subscription's lesson range.
 *
 * Fixes the historical gap where approving a subscription set the lesson range
 * and credits but never created student_units enrollments — so subscribers saw
 * no curriculum in the app and their progress could never advance.
 *
 * Idempotent: units already enrolled are skipped, so running it twice is safe.
 */
class BackfillEnrollmentsCommand extends Command
{
    protected $signature   = 'crm:backfill-enrollments {--dry-run : Report what would change without writing}';
    protected $description = 'Enroll active subscribers in units covered by their subscription lesson range.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $subs = Subscription::where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('from_lesson_id')
            ->whereNotNull('to_lesson_id')
            ->with('student.user')
            ->get();

        $this->info(($dry ? '[DRY-RUN] ' : '') . "Scanning {$subs->count()} active subscriptions…");

        $totalUnits    = 0;
        $touchedStudents = 0;

        foreach ($subs as $sub) {
            $user = $sub->student?->user;
            if (!$user) {
                continue;
            }

            if ($dry) {
                // Compute what WOULD be enrolled without writing
                $lo = min($sub->from_lesson_id, $sub->to_lesson_id);
                $hi = max($sub->from_lesson_id, $sub->to_lesson_id);
                $unitIds = \App\Models\Lesson::whereBetween('id', [$lo, $hi])
                    ->whereNotNull('unit_id')->distinct()->pluck('unit_id');
                $already = $user->enrolledUnits()->pluck('units.id');
                $new = $unitIds->diff($already);

                if ($new->isNotEmpty()) {
                    $this->line("  {$user->name} (uid:{$user->id}) → would enroll units: {$new->implode(', ')}");
                    $totalUnits += $new->count();
                    $touchedStudents++;
                }
            } else {
                $count = $sub->enrollCoveredUnits();
                if ($count > 0) {
                    $this->line("  {$user->name} (uid:{$user->id}) → enrolled {$count} unit(s)");
                    $totalUnits += $count;
                    $touchedStudents++;
                }
            }
        }

        $verb = $dry ? 'would enroll' : 'enrolled';
        $this->info("✓ Done — {$verb} {$totalUnits} unit(s) across {$touchedStudents} student(s).");

        return self::SUCCESS;
    }
}
