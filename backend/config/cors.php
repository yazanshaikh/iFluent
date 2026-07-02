<?php

return [

    /*
     * CORS for the SPA frontends (CRM + Landing) hitting the API cross-origin.
     * The mobile apps are native and don't enforce CORS, so they don't need to
     * be listed here. Auth uses Bearer tokens (Authorization header), NOT cookies,
     * so `supports_credentials` stays false and explicit origins are allowed.
     */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://crm.ifluent.app',
        'https://ifluent.app',
        'https://www.ifluent.app',
    ],

    // Allow any localhost port during local development (Vite/Expo web).
    'allowed_origins_patterns' => [
        '/^http:\/\/localhost(:\d+)?$/',
        '/^http:\/\/127\.0\.0\.1(:\d+)?$/',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,

];
