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
 * Fired when teacher ends the session.
 * Tells the student app to close the classroom and show the completion screen.
 */
class SessionEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Session $session,
        public readonly string  $attendanceStatus,
    ) {}

    public function broadcastOn(): Channel
    {
        return new PrivateChannel('student.' . $this->session->student_id);
    }

    public function broadcastAs(): string
    {
        return 'session.ended';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id'        => $this->session->id,
            'status'            => $this->session->status,           // ✅ Added: session status
            'attendance_status' => $this->attendanceStatus,
            'ended_at'          => $this->session->ended_at,         // ✅ Added: completion time
            'lesson'            => [                                 // ✅ Added: updated lesson info
                'id'    => $this->session->lesson?->id,
                'title' => $this->session->lesson?->title,
            ],
        ];
    }
}
