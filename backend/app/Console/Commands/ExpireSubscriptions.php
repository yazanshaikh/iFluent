<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\Session;
use App\Models\SessionRequest;
use App\Models\Subscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireSubscriptions extends Command
{
    protected $signature   = 'crm:expire-subscriptions';
    protected $description = 'Expire subscriptions past their end date with no lessons left, and return expired students to the Lead Pool after the grace period.';

    public function handle(): int
    {
        // A student with lessons left keeps studying past the end date. A lesson
        // that is already booked has used its credit, so it must not cut access.
        $expired = Subscription::query()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->whereHas('student', fn ($student) => $student
                ->whereHas('user', fn ($user) => $user->where('lesson_credits', '<=', 0))
                ->whereNotExists(fn ($q) => $q->select(DB::raw(1))
                    ->from('session_requests')
                    ->whereColumn('session_requests.student_id', 'students.user_id')
                    ->whereIn('status', [SessionRequest::STATUS_PENDING, SessionRequest::STATUS_CONFIRMED])
                    ->where('requested_at_utc', '>', now()))
                ->whereNotExists(fn ($q) => $q->select(DB::raw(1))
                    ->from('sessions')
                    ->whereColumn('sessions.student_id', 'students.user_id')
                    ->whereIn('sessions.status', [Session::STATUS_WAITING, Session::STATUS_ACTIVE])))
            ->update(['status' => Subscription::STATUS_EXPIRED]);

        // Once a student has dropped off Paid Students, put them back in the Lead Pool.
        // "subscriber" is excluded from the pool, so without this they'd be on no list.
        $cutoff = now()->subDays(Subscription::NOT_SUBSCRIBED_GRACE_DAYS);

        $returned = Lead::query()
            ->where('status', Lead::STATUS_SUBSCRIBER)
            ->whereHas('student.subscriptions', fn ($s) => $s->where('status', Subscription::STATUS_EXPIRED))
            ->whereDoesntHave('student.subscriptions', fn ($s) => $s
                ->whereIn('status', [Subscription::STATUS_ACTIVE, Subscription::STATUS_PENDING]))
            ->whereDoesntHave('student.subscriptions', fn ($s) => $s
                ->where('status', Subscription::STATUS_EXPIRED)
                ->where('updated_at', '>=', $cutoff))
            ->update(['status' => Lead::STATUS_NO_ANSWER]);

        $this->info("✓ Expired {$expired} subscription(s); returned {$returned} student(s) to the Lead Pool.");

        return self::SUCCESS;
    }
}
