<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Verifies an App Store receipt with Apple and returns the matching transaction.
 *
 * NEVER trust the client: the app tells us "the user paid", but only Apple can
 * confirm it. Without this step anyone could call the booking endpoint with a
 * made-up receipt and get free paid sessions.
 *
 * Uses the /verifyReceipt endpoint (shared-secret based). Apple recommends the
 * newer App Store Server API for new work; verifyReceipt still serves consumables
 * and needs no key management, which is why it is used here. Swapping it later
 * only touches this class.
 */
class AppleReceiptValidator
{
    private const PROD    = 'https://buy.itunes.apple.com/verifyReceipt';
    private const SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';

    /** Apple's "this receipt is from the sandbox" status — retry there. */
    private const STATUS_SANDBOX_RECEIPT = 21007;

    /**
     * @return array{transaction_id:string, original_transaction_id:?string, product_id:string, purchased_at:?int, raw:array}
     *
     * @throws RuntimeException when the receipt is invalid, or holds no purchase
     *                          of $expectedProductId.
     */
    public function validate(string $receiptData, string $expectedProductId): array
    {
        $secret = config('services.apple.shared_secret');

        if (empty($secret)) {
            throw new RuntimeException('Apple IAP is not configured (APPLE_IAP_SHARED_SECRET).');
        }

        // Always try production first; Apple answers 21007 for a sandbox receipt,
        // which is the documented way to support both without a build-time flag.
        $response = $this->post(self::PROD, $receiptData, $secret);

        if (($response['status'] ?? null) === self::STATUS_SANDBOX_RECEIPT) {
            $response = $this->post(self::SANDBOX, $receiptData, $secret);
        }

        $status = $response['status'] ?? -1;

        if ($status !== 0) {
            Log::warning('Apple receipt rejected', ['status' => $status]);

            throw new RuntimeException("Apple rejected the receipt (status {$status}).");
        }

        // in_app holds every transaction in the receipt; pick the newest one that
        // matches our product so an old unrelated purchase can't be replayed.
        $candidates = array_filter(
            $response['receipt']['in_app'] ?? [],
            fn ($t) => ($t['product_id'] ?? null) === $expectedProductId,
        );

        if (!$candidates) {
            throw new RuntimeException('The receipt contains no purchase of this product.');
        }

        usort($candidates, fn ($a, $b) => ($b['purchase_date_ms'] ?? 0) <=> ($a['purchase_date_ms'] ?? 0));
        $tx = $candidates[0];

        if (empty($tx['transaction_id'])) {
            throw new RuntimeException('The receipt has no transaction id.');
        }

        return [
            'transaction_id'          => (string) $tx['transaction_id'],
            'original_transaction_id' => isset($tx['original_transaction_id'])
                ? (string) $tx['original_transaction_id']
                : null,
            'product_id'              => (string) $tx['product_id'],
            'purchased_at'            => isset($tx['purchase_date_ms'])
                ? (int) ((int) $tx['purchase_date_ms'] / 1000)
                : null,
            'raw'                     => $tx,
        ];
    }

    private function post(string $url, string $receiptData, string $secret): array
    {
        $response = Http::timeout(15)->post($url, [
            'receipt-data' => $receiptData,
            'password'     => $secret,
            'exclude-old-transactions' => false,
        ]);

        if (!$response->successful()) {
            throw new RuntimeException("Could not reach Apple ({$response->status()}).");
        }

        return $response->json() ?? [];
    }
}
