<?php

namespace App\Services;

use App\Models\GroupClass;
use App\Models\Session;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DailyCoService
{
    private string $apiKey;
    private string $baseUrl;

    /**
     * Session duration limit in hours — after this the Daily.co room auto-expires.
     * Set generously; teacher is expected to close manually via the end endpoint.
     */
    private const SESSION_EXPIRY_HOURS = 3;

    public function __construct()
    {
        $this->apiKey  = config('services.daily.api_key');
        $this->baseUrl = config('services.daily.base_url');
    }

    // ─── Create Room ──────────────────────────────────────────────────────────

    /**
     * Creates a private Daily.co room for the given session.
     * Room name is deterministic: "ifluent-session-{id}" so it can be
     * reconstructed if needed without extra DB lookups.
     *
     * @return array{room_name: string, room_url: string}
     * @throws \RuntimeException on Daily.co API failure
     */
    public function createRoom(Session $session): array
    {
        $roomName = $this->buildRoomName($session->id);

        $response = Http::withToken($this->apiKey)
            ->timeout(10)
            ->post("{$this->baseUrl}/rooms", [
                'name'       => $roomName,
                // Public so the student (non-owner) joins reliably. Private rooms
                // reject non-owner meeting tokens under our Daily account settings.
                // Rooms are per-session, short-lived (auto-expire) and unguessable enough.
                'privacy'    => 'public',
                'properties' => [
                    'max_participants' => 6,               // headroom for reconnects / multi-device
                    'enable_chat'      => false,
                    'exp'              => now()->addHours(self::SESSION_EXPIRY_HOURS)->timestamp,
                    'start_video_off'  => false,
                    'start_audio_off'  => false,
                    // Automatically record the session (optional, set to false for privacy)
                    'enable_recording' => false,
                ],
            ]);

        if (!$response->successful()) {
            Log::error('Daily.co createRoom failed', [
                'session_id' => $session->id,
                'status'     => $response->status(),
                'body'       => $response->body(),
            ]);

            throw new \RuntimeException(
                "Failed to create Daily.co room. Status: {$response->status()}"
            );
        }

        $data = $response->json();

        return [
            'room_name' => $data['name'],
            'room_url'  => $data['url'],
        ];
    }

    // ─── Ensure Public ────────────────────────────────────────────────────────

    /**
     * Make sure an existing room is public (idempotent). Older rooms may have been
     * created as private — private rooms reject non-owner tokens under our Daily
     * account, blocking the student. Best-effort; failures are logged only.
     */
    public function ensureRoomPublic(string $roomName): void
    {
        try {
            Http::withToken($this->apiKey)
                ->timeout(10)
                ->post("{$this->baseUrl}/rooms/{$roomName}", [
                    'privacy'    => 'public',
                    'properties' => ['max_participants' => 6],
                ]);
        } catch (\Throwable $e) {
            Log::warning('Daily.co ensureRoomPublic failed', ['room' => $roomName, 'error' => $e->getMessage()]);
        }
    }

    // ─── Delete Room ──────────────────────────────────────────────────────────

    /**
     * Deletes the Daily.co room when the session ends.
     * Prevents any further joins. Silently skips if room doesn't exist.
     */
    // ─── Create Meeting Token ─────────────────────────────────────────────────

    /**
     * Creates a short-lived Daily.co meeting token for a participant.
     * Teacher gets is_owner=true (can control room, start recording).
     * Student gets is_owner=false (can join but not control).
     *
     * Returns the token string to be appended as ?t={token} to the room URL.
     */
    public function createMeetingToken(string $roomName, bool $isOwner = false): string
    {
        $response = Http::withToken($this->apiKey)
            ->timeout(10)
            ->post("{$this->baseUrl}/meeting-tokens", [
                'properties' => [
                    'room_name'  => $roomName,
                    'is_owner'   => $isOwner,
                    'exp'        => now()->addHours(self::SESSION_EXPIRY_HOURS)->timestamp,
                    'enable_screenshare' => $isOwner,
                    'start_video_off'    => false,
                    'start_audio_off'    => false,
                ],
            ]);

        if (!$response->successful()) {
            Log::error('Daily.co createMeetingToken failed', [
                'room_name' => $roomName,
                'status'    => $response->status(),
                'body'      => $response->body(),
            ]);
            throw new \RuntimeException("Failed to create Daily.co meeting token.");
        }

        return $response->json('token');
    }

    // ─── Delete Room ──────────────────────────────────────────────────────────

    public function deleteRoom(string $roomName): void
    {
        $response = Http::withToken($this->apiKey)
            ->timeout(10)
            ->delete("{$this->baseUrl}/rooms/{$roomName}");

        // 404 means room is already gone — not an error
        if (!$response->successful() && $response->status() !== 404) {
            Log::warning('Daily.co deleteRoom failed', [
                'room_name' => $roomName,
                'status'    => $response->status(),
                'body'      => $response->body(),
            ]);
        }
    }

    // ─── Create Group Room ────────────────────────────────────────────────────

    /**
     * Creates a Daily.co room for a group class.
     * Supports up to max_seats + 1 (teacher) participants.
     *
     * @return array{room_name: string, room_url: string}
     */
    public function createGroupRoom(GroupClass $groupClass): array
    {
        $roomName = 'ifluent-group-' . $groupClass->id;

        $response = Http::withToken($this->apiKey)
            ->timeout(10)
            ->post("{$this->baseUrl}/rooms", [
                'name'       => $roomName,
                'privacy'    => 'public',   // students join without token
                'properties' => [
                    'max_participants' => $groupClass->max_seats + 1,  // +1 for teacher
                    'enable_chat'      => true,
                    'exp'              => now()->addHours(self::SESSION_EXPIRY_HOURS)->timestamp,
                    'enable_recording' => false,
                ],
            ]);

        if (!$response->successful()) {
            Log::error('Daily.co createGroupRoom failed', [
                'group_class_id' => $groupClass->id,
                'status'         => $response->status(),
                'body'           => $response->body(),
            ]);
            throw new \RuntimeException("Failed to create Daily.co group room.");
        }

        $data = $response->json();

        return [
            'room_name' => $data['name'],
            'room_url'  => $data['url'],
        ];
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private function buildRoomName(int $sessionId): string
    {
        return 'ifluent-session-' . $sessionId;
    }
}
