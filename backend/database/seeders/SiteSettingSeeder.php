<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            // ── Hero Section ───────────────────────────────────────────────────
            ['key' => 'hero_title',        'value' => 'تعلّم الإنجليزية مع أفضل المعلمين', 'type' => 'text',  'label' => 'Hero Title',    'group' => 'hero'],
            ['key' => 'hero_subtitle',     'value' => 'حصص خاصة وجلسات مجموعية تفاعلية عبر منصة iFluent', 'type' => 'text', 'label' => 'Hero Subtitle', 'group' => 'hero'],
            ['key' => 'hero_cta_text',     'value' => 'احجز حصة تقييم مستوى مجانية',       'type' => 'text',  'label' => 'CTA Button Text','group' => 'hero'],
            ['key' => 'hero_image',        'value' => null,                                 'type' => 'image', 'label' => 'Hero Image',     'group' => 'hero'],

            // ── About Section ──────────────────────────────────────────────────
            ['key' => 'about_title',       'value' => 'من نحن',                             'type' => 'text',  'label' => 'About Title',   'group' => 'about'],
            ['key' => 'about_text',        'value' => 'iFluent منصة متكاملة لتعليم اللغة الإنجليزية عبر جلسات حية مع معلمين متخصصين.', 'type' => 'html', 'label' => 'About Text', 'group' => 'about'],
            ['key' => 'about_image',       'value' => null,                                 'type' => 'image', 'label' => 'About Image',   'group' => 'about'],

            // ── Contact ────────────────────────────────────────────────────────
            ['key' => 'contact_phone',     'value' => '0780105274',                        'type' => 'text',  'label' => 'Phone',          'group' => 'contact'],
            ['key' => 'contact_email',     'value' => 'info@ifluent.io',                   'type' => 'text',  'label' => 'Email',          'group' => 'contact'],
            ['key' => 'contact_whatsapp',  'value' => '0780105274',                        'type' => 'text',  'label' => 'WhatsApp',       'group' => 'contact'],

            // ── Social Links ───────────────────────────────────────────────────
            ['key' => 'social_instagram',   'value' => null, 'type' => 'text',  'label' => 'Instagram URL',      'group' => 'footer'],
            ['key' => 'social_facebook',    'value' => null, 'type' => 'text',  'label' => 'Facebook URL',       'group' => 'footer'],
            ['key' => 'social_tiktok',      'value' => null, 'type' => 'text',  'label' => 'TikTok URL',         'group' => 'footer'],
            // null = not published yet → button is disabled/grayed in UI
            ['key' => 'app_store_url',      'value' => null, 'type' => 'text',  'label' => 'App Store URL',      'group' => 'footer'],
            ['key' => 'google_play_url',    'value' => null, 'type' => 'text',  'label' => 'Google Play URL',    'group' => 'footer'],
            ['key' => 'footer_text',        'value' => '© 2026 iFluent. جميع الحقوق محفوظة.', 'type' => 'text', 'label' => 'Footer Text', 'group' => 'footer'],

            // ── General ────────────────────────────────────────────────────────
            ['key' => 'platform_name',     'value' => 'iFluent',                            'type' => 'text',  'label' => 'Platform Name',  'group' => 'general'],
            ['key' => 'logo',              'value' => null,                                 'type' => 'image', 'label' => 'Logo',           'group' => 'general'],
            ['key' => 'favicon',           'value' => null,                                 'type' => 'image', 'label' => 'Favicon',        'group' => 'general'],
        ];

        foreach ($defaults as $setting) {
            SiteSetting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Site settings seeded (' . count($defaults) . ' keys).');
    }
}
