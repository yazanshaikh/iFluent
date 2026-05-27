<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminMessage;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminMessageController extends Controller
{
    /**
     * List all sent messages (newest first).
     */
    public function index(): JsonResponse
    {
        $messages = AdminMessage::with('sender:id,name')
            ->withCount('recipients')
            ->latest()
            ->get()
            ->map(fn ($m) => [
                'id'               => $m->id,
                'title'            => $m->title,
                'body'             => $m->body,
                'target'           => $m->target,
                'sent_by'          => $m->sender?->name,
                'recipients_count' => $m->recipients_count,
                'created_at'       => $m->created_at->toIso8601String(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    /**
     * Create and dispatch a message to the resolved target group.
     * Recipients are snapshotted at send time — joining/leaving later has no effect.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'  => 'required|string|max:255',
            'body'   => 'required|string|max:5000',
            'target' => ['required', Rule::in(['all', 'subscribers', 'non_subscribers'])],
        ]);

        $recipientIds = $this->resolveRecipients($data['target']);

        if ($recipientIds->isEmpty()) {
            return response()->json(['message' => 'لا يوجد طلاب في المجموعة المستهدفة.'], 422);
        }

        $message = AdminMessage::create([
            'title'   => $data['title'],
            'body'    => $data['body'],
            'target'  => $data['target'],
            'sent_by' => $request->user()->id,
        ]);

        // Attach recipients with read_at = null
        $pivotData = $recipientIds->mapWithKeys(fn ($id) => [$id => ['read_at' => null]]);
        $message->recipients()->attach($pivotData);

        return response()->json([
            'message'          => 'تم إرسال الرسالة بنجاح.',
            'id'               => $message->id,
            'recipients_count' => $recipientIds->count(),
        ], 201);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function resolveRecipients(string $target): \Illuminate\Support\Collection
    {
        $base = User::where('role', 'student');

        return match ($target) {
            'all' => $base->pluck('id'),

            'subscribers' => $base
                ->whereHas('subscriptions', fn ($q) =>
                    $q->where('status', Subscription::STATUS_ACTIVE)
                )
                ->pluck('id'),

            'non_subscribers' => $base
                ->whereDoesntHave('subscriptions', fn ($q) =>
                    $q->where('status', Subscription::STATUS_ACTIVE)
                )
                ->pluck('id'),
        };
    }
}
