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
    private string $serverKey;
    private string $endpoint = 'https://fcm.googleapis.com/fcm/send';

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key', '');
    }

    // ─── Core Send ────────────────────────────────────────────────────────────

    /**
     * Send to a single device token.
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        if (empty($this->serverKey) || empty($token)) {
            return false;
        }

        try {
            $response = Http::withToken($this->serverKey)
                ->post($this->endpoint, [
                    'to'           => $token,
                    'notification' => ['title' => $title, 'body' => $body, 'sound' => 'default'],
                    'data'         => $data,
                    'priority'     => 'high',
                ]);

            if (!$response->successful()) {
                Log::warning('FCM send failed', ['token' => substr($token, 0, 20), 'response' => $response->body()]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('FCM exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send to a topic (e.g., group class broadcast).
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): bool
    {
        return $this->sendToToken("/topics/{$topic}", $title, $body, $data);
    }

    /**
     * Send to multiple tokens (batch).
     */
    public function sendToMultiple(array $tokens, string $title, string $body, array $data = []): void
    {
        if (empty($this->serverKey) || empty($tokens)) {
            return;
        }

        // FCM supports up to 1000 tokens per batch
        foreach (array_chunk($tokens, 1000) as $chunk) {
            try {
                Http::withToken($this->serverKey)
                    ->post($this->endpoint, [
                        'registration_ids' => $chunk,
                        'notification'     => ['title' => $title, 'body' => $body, 'sound' => 'default'],
                        'data'             => $data,
                        'priority'         => 'high',
                    ]);
            } catch (\Throwable $e) {
                Log::error('FCM batch exception', ['error' => $e->getMessage()]);
            }
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

    /** Session starting in 15 minutes → notify teacher + student */
    public function sessionReminder(User $user, int $sessionId, string $scheduledAt): void
    {
        $this->notifyUser(
            $user,
            'حصتك بعد 15 دقيقة ⏰',
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
