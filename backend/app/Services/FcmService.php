<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Firebase Cloud Messaging — Push Notification Service
 *
 * Uses FCM HTTP v1 API (OAuth2 Bearer token).
 * Server key stored in config/services.php → services.fcm.server_key
 *
 * All notification methods are fire-and-forget (logged on failure, not thrown).
 */
class FcmService
{
    // Expo Push API — Expo relays to FCM (Android) / APNs (iOS).
    // Tokens are Expo push tokens ("ExponentPushToken[...]") stored in users.fcm_token.
    private string $endpoint = 'https://exp.host/--/api/v2/push/send';
    private ?string $accessToken;

    public function __construct()
    {
        // Optional Expo access token (only if "Enhanced Security" is enabled).
        $this->accessToken = config('services.expo.access_token') ?: null;
    }

    // ─── Core Send ────────────────────────────────────────────────────────────

    /**
     * Send to a single Expo push token.
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        if (empty($token)) {
            return false;
        }
        return $this->push([$this->buildMessage($token, $title, $body, $data)]);
    }

    /**
     * Topics are not supported by Expo Push — kept for API compatibility (no-op).
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): bool
    {
        Log::info('sendToTopic skipped — Expo Push has no topics', ['topic' => $topic]);
        return false;
    }

    /**
     * Send to multiple Expo push tokens (Expo accepts up to 100 messages/request).
     */
    public function sendToMultiple(array $tokens, string $title, string $body, array $data = []): void
    {
        $tokens = array_values(array_filter($tokens));
        if (empty($tokens)) {
            return;
        }
        foreach (array_chunk($tokens, 100) as $chunk) {
            $messages = array_map(fn ($t) => $this->buildMessage($t, $title, $body, $data), $chunk);
            $this->push($messages);
        }
    }

    // ─── Transport helpers ──────────────────────────────────────────────────

    private function buildMessage(string $token, string $title, string $body, array $data): array
    {
        return [
            'to'        => $token,
            'title'     => $title,
            'body'      => $body,
            'data'      => $data,
            'sound'     => 'default',
            'priority'  => 'high',
            'channelId' => 'default',
        ];
    }

    private function push(array $messages): bool
    {
        try {
            $req = Http::acceptJson()->asJson();
            if ($this->accessToken) {
                $req = $req->withToken($this->accessToken);
            }
            $response = $req->post($this->endpoint, $messages);

            if (!$response->successful()) {
                Log::warning('Expo push failed', ['status' => $response->status(), 'body' => $response->body()]);
                return false;
            }
            return true;
        } catch (\Throwable $e) {
            Log::error('Expo push exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    // ─── Convenience Methods ──────────────────────────────────────────────────

    public function notifyUser(User $user, string $title, string $body, array $data = []): bool
    {
        if (!$user->fcm_token) {
            return false;
        }
        return $this->sendToToken($user->fcm_token, $title, $body, $data);
    }

    // ─── Domain Events ────────────────────────────────────────────────────────

    /** Teacher accepted a session request → notify student */
    public function sessionConfirmed(User $student, array $sessionData): void
    {
        $this->notifyUser(
            $student,
            'تم تأكيد حصتك! 🎉',
            "معلمك {$sessionData['teacher_name']} قبل الحصة. موعدها: {$sessionData['scheduled_at']}",
            ['type' => 'session_confirmed', 'session_id' => (string) $sessionData['session_id']]
        );
    }

    /** Teacher rejected private session request → notify student */
    public function sessionRejected(User $student, array $requestData): void
    {
        $this->notifyUser(
            $student,
            'طلب الحصة',
            'اعتذر المعلم عن هذا الموعد. يمكنك اختيار موعد آخر.',
            ['type' => 'session_rejected', 'request_id' => (string) $requestData['request_id']]
        );
    }

    /** Session starting in ~10 minutes → notify the student */
    public function sessionReminder(User $user, int $sessionId, string $scheduledAt): void
    {
        $this->notifyUser(
            $user,
            'حصتك بعد 10 دقائق ⏰',
            'استعد! حصتك ستبدأ قريباً.',
            ['type' => 'session_reminder', 'session_id' => (string) $sessionId]
        );
    }

    /** Subscription approved → notify student */
    public function subscriptionActivated(User $student, string $packageName): void
    {
        $this->notifyUser(
            $student,
            'تم تفعيل اشتراكك! 🚀',
            "مبروك! تم تفعيل باقة {$packageName}. ابدأ رحلتك الآن.",
            ['type' => 'subscription_activated']
        );
    }

    /** New demo request in pool → notify all teachers */
    public function newDemoRequest(array $teacherTokens, int $requestId): void
    {
        if (empty($teacherTokens)) {
            return;
        }
        $this->sendToMultiple(
            $teacherTokens,
            'طلب حصة تجريبية جديد 📚',
            'يوجد طلب حصة تجريبية جديد في البركة. اقبله الآن!',
            ['type' => 'new_demo_request', 'request_id' => (string) $requestId]
        );
    }

    /** Group class 30 minutes before → notify all registered students */
    public function groupClassReminder(array $studentTokens, int $groupClassId, string $title): void
    {
        if (empty($studentTokens)) {
            return;
        }
        $this->sendToMultiple(
            $studentTokens,
            'درس مجموعي بعد 30 دقيقة! 👥',
            "درس \"{$title}\" سيبدأ بعد 30 دقيقة. كن مستعداً!",
            ['type' => 'group_class_reminder', 'group_class_id' => (string) $groupClassId]
        );
    }

    /** Quiz passed with ≥80% → in-app celebration trigger */
    public function quizExcellent(User $student, string $lessonTitle, int $score): void
    {
        $this->notifyUser(
            $student,
            "أداء رائع! 🏆 {$score}%",
            "أجبت بتميز في اختبار \"{$lessonTitle}\". استمر!",
            ['type' => 'quiz_excellent', 'score' => (string) $score]
        );
    }
}
