import { apiClient } from './client';
import type { SiteSettings } from '@ifluent/shared';

// Re-export so callers can import SiteSettings from here without changing their imports
export type { SiteSettings };

/** Hero primary CTA — single source of truth for the main booking button */
export const HERO_CTA_LABEL = 'احجز حصة تقييم مستوى مجانية';

/** Legacy DB/API values still seen in production — map to {@link HERO_CTA_LABEL} */
const LEGACY_HERO_CTA: string[] = [
  'ابدأ رحلتك الآن',
  'ابدأ رحلتك الان',
  'ابدأ رحلتك الأن',
];

function normalizeHeroCta(text: string | undefined): string {
  const t = (text ?? '').trim();
  if (!t) return HERO_CTA_LABEL;
  if (LEGACY_HERO_CTA.includes(t)) return HERO_CTA_LABEL;
  return t;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_title:       'تعلّم الإنجليزية مع أفضل المعلمين',
  hero_subtitle:    'حصص خاصة وجلسات مجموعية تفاعلية — في أي وقت، من أي مكان.',
  hero_cta_text:    HERO_CTA_LABEL,
  about_title:      'من نحن',
  about_text:       'iFluent منصة متكاملة لتعليم اللغة الإنجليزية عبر جلسات حية مع معلمين متخصصين.',
  contact_phone:    '0780105274',
  contact_email:    'info@ifluent.io',
  contact_whatsapp: '0780105274',
  social_instagram: null,
  social_facebook:  null,
  social_snapchat:  null,
  social_tiktok:    null,
  app_store_url:    null,
  google_play_url:  null,
  desktop_mac_url:     null,
  desktop_windows_url: null,
  footer_text:      '© 2026 iFluent. جميع الحقوق محفوظة.',
  platform_name:    'iFluent',
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const { data } = await apiClient.get('/settings');
    const merged = { ...DEFAULT_SETTINGS, ...data.settings } as SiteSettings;
    merged.hero_cta_text = normalizeHeroCta(merged.hero_cta_text);
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
