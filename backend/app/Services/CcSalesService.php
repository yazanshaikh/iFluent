<?php

namespace App\Services;

use App\Models\CcLedgerEntry;
use App\Models\Subscription;
use App\Models\User;

/**
 * A CC's sales since their counter last started. A sale counts once an admin
 * approves the invoice, and stays counted even if the subscription is cancelled.
 * Refunds an admin records since the same start date are deducted.
 */
class CcSalesService
{
    /** @return array{amount:float, gross:float, refunds_deducted:float, count:int, since:string} */
    public function forUser(User $cc): array
    {
        $since = $cc->sales_reset_at ?? $cc->created_at;

        $sales = Subscription::where('activated_by', $cc->id)
            ->whereNotNull('activated_at')      // rejected invoices are never activated
            ->where('activated_at', '>', $since);

        $gross = (float) (clone $sales)->sum('amount_paid');

        // Deducted by the sales start date, so resetting the refund counter
        // doesn't change the sales figure.
        $refunds = (float) CcLedgerEntry::where('user_id', $cc->id)
            ->where('type', CcLedgerEntry::TYPE_REFUND)
            ->where('created_at', '>', $since)
            ->sum('amount');

        return [
            'amount'           => $gross - $refunds,
            'gross'            => $gross,
            'refunds_deducted' => $refunds,
            'count'            => (clone $sales)->count(),
            'since'            => $since->toIso8601String(),
        ];
    }

    /** @return array{due:float, refund_count:int, refund_amount:float} */
    public function ledger(User $cc): array
    {
        $open = fn (string $type) => CcLedgerEntry::where('user_id', $cc->id)->where('type', $type)->open();

        return [
            'due'           => (float) $open(CcLedgerEntry::TYPE_DUE)->sum('amount'),
            'refund_count'  => $open(CcLedgerEntry::TYPE_REFUND)->count(),
            'refund_amount' => (float) $open(CcLedgerEntry::TYPE_REFUND)->sum('amount'),
        ];
    }

    /** Everything currently due to all CCs (dashboard). */
    public function totalDue(): float
    {
        return (float) CcLedgerEntry::where('type', CcLedgerEntry::TYPE_DUE)->open()->sum('amount');
    }
}
