<?php

namespace App\Support;

/**
 * Canonical phone normalisation → strict E.164 (e.g. +9627xxxxxxxx).
 *
 * MUST mirror the client helper (apps/frontend-student/src/lib/phone.ts) so the
 * SAME human number always resolves to ONE stored value — no matter whether it
 * arrives from Firebase (already +962…), the secret-login (local 07…), or the
 * CRM (sometimes Arabic-Indic digits ٠٧…). Without this, one person ends up with
 * several user rows and "logs into a different account" each time.
 *
 * Default country: Jordan (+962).
 */
class Phone
{
    /**
     * Normalise any input to E.164. Returns null when the result is not a
     * plausible international number (caller decides the fallback).
     */
    public static function toE164(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }

        // 1) Convert Arabic-Indic (٠-٩) and Eastern-Arabic (۰-۹) digits to ASCII.
        $input = strtr($input, [
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
            '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        ]);

        // 2) Strip spaces, dashes, parentheses.
        $s = preg_replace('/[\s\-()]/', '', $input);

        // 3) Reduce to a leading "+" (optional) followed by digits only.
        $hasPlus = str_starts_with($s, '+');
        $digits  = preg_replace('/\D/', '', $s);
        if ($digits === '') {
            return null;
        }
        $s = ($hasPlus ? '+' : '') . $digits;

        // 4) Canonicalise to E.164.
        if (str_starts_with($s, '00')) {
            $s = '+' . substr($s, 2);          // 00962… → +962…
        }
        if (! str_starts_with($s, '+')) {
            if (str_starts_with($s, '962')) {
                $s = '+' . $s;                 // 962787…  → +962787… (already has country code)
            } else {
                $s = '+962' . preg_replace('/^0/', '', $s); // local 07… → +9627…
            }
        }

        // 5) Validate: "+" then 8–15 digits.
        return preg_match('/^\+[1-9]\d{7,14}$/', $s) ? $s : null;
    }

    /**
     * Normalise, falling back to the trimmed original when normalisation fails
     * (so non-standard data is never silently dropped on save).
     */
    public static function normalizeOrRaw(?string $input): ?string
    {
        if ($input === null) {
            return null;
        }
        return self::toE164($input) ?? trim($input);
    }
}
