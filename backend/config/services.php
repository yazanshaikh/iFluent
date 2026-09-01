<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // ── Daily.co ─────────────────────────────────────────────────────────────
    'daily' => [
        'api_key'        => env('DAILY_API_KEY'),
        'base_url'       => env('DAILY_API_BASE_URL', 'https://api.daily.co/v1'),
        'webhook_secret' => env('DAILY_WEBHOOK_SECRET'),
    ],

    // ── Student SMS-bypass login (testing only) ───────────────────────────────
    // Leave SECRET_LOGIN_CODE unset in production to disable the bypass entirely.
    // ── Apple in-app purchase (StoreKit) ──────────────────────────────────────
    // shared_secret: App Store Connect → App → App Information → App-Specific
    // Shared Secret. product_id: the Consumable product's identifier.
    'apple' => [
        'shared_secret'        => env('APPLE_IAP_SHARED_SECRET'),
        'assessment_product_id'=> env('APPLE_IAP_ASSESSMENT_PRODUCT_ID', 'io.ifluent.student.assessment'),
    ],

    'student_auth' => [
        'secret_login_code' => env('SECRET_LOGIN_CODE'),
    ],

    // ── Public invoice/payment frontend base URL (the /pay/:uuid page) ─────────
    'invoice_base_url' => env('INVOICE_BASE_URL'),

    // ── Firebase Cloud Messaging ──────────────────────────────────────────────
    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY'),
    ],

    // ── Firebase (Phone Auth token verification) ──────────────────────────────
    'firebase' => [
        'project_id' => env('FIREBASE_PROJECT_ID', 'ifluent-58302'),
    ],

];
