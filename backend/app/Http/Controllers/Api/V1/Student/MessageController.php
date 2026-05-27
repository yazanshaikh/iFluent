<?php

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\AdminMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * List all messages sent to this student, newest first.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $messages = AdminMessage::whereHas('recipients', fn ($q) => $q->where('user_id', $userId))
            ->with(['recipients' => fn ($q) => $q->where('user_id', $userId)->select('users.id')])
            ->latest()
            ->get()
            ->map(function ($m) use ($userId) {
                $pivot = $m->recipients->first()?->pivot;
                return [
                    'id'         => $m->id,
                    'title'      => $m->title,
                    'body'       => $m->body,
                    'read_at'    => $pivot?->read_at,
                    'created_at' => $m->created_at->toIso8601String(),
                ];
            });

        $unread = $messages->whereNull('read_at')->count();

        return response()->json([
            'messages' => $messages,
            'unread'   => $unread,
        ]);
    }

    /**
     * Mark a single message as read.
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;

        $updated = \DB::table('admin_message_recipients')
            ->where('admin_message_id', $id)
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true, 'updated' => $updated]);
    }

    /**
     * Unread count only — lightweight for badge polling.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = \DB::table('admin_message_recipients')
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['unread' => $count]);
    }
}
