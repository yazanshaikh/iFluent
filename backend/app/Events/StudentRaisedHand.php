<?php

namespace App\Events;

use App\Models\Session;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when student raises their hand during a live session.
 * Broadcast to teacher's private channel so they see it instantly.
 */
class StudentRaisedHand implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Session $session,
        public readonly string  $studentName,
    ) {}

    public function broadcastOn(): Channel
    {
        // Broadcast to teacher's private channel
        return new PrivateChannel('teacher.' . $this->session->teacher_id);
    }

    public function broadcastAs(): string
    {
        return 'student.raised-hand';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id'   => $this->session->id,
            'student_name' => $this->studentName,
            'raised_at'    => now()->toIso8601String(),
        ];
    }
}
