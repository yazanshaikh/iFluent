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
 * Fired when teacher starts the session (Daily room created + Nearpod PIN saved).
 * Broadcast to the student's private channel so the "انضم للحصة" button appears immediately.
 */
class SessionActivated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Session $session) {}

    public function broadcastOn(): Channel
    {
        // Private channel per student — only their sessions
        return new PrivateChannel('student.' . $this->session->student_id);
    }

    public function broadcastAs(): string
    {
        return 'session.activated';
    }

    public function broadcastWith(): array
    {
        return [
            'session_id'     => $this->session->id,
            'status'         => $this->session->status,
            'daily_room_url' => $this->session->daily_room_url,
            'nearpod_pin'    => $this->session->nearpod_pin,
            'nearpod_url'    => $this->session->lesson?->nearpod_url,
        ];
    }
}
