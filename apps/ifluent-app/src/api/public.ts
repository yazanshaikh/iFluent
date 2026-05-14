import { apiClient } from './client';

export interface SiteSettings {
  // Hero
  hero_title?:       string;
  hero_subtitle?:    string;
  hero_cta_text?:    string;
  hero_image?:       string;
  // About
  about_title?:      string;
  about_text?:       string;
  about_image?:      string;
  // Contact
  contact_phone?:    string;
  contact_email?:    string;
  contact_whatsapp?: string;
  // Footer & social
  social_instagram?: string | null;
  social_facebook?:  string | null;
  social_snapchat?:  string | null;
  social_tiktok?:    string | null;
  app_store_url?:    string | null;
  google_play_url?:  string | null;
  footer_text?:      string;
  // General
  platform_name?:    string;
  logo?:             string | null;
}

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
  contact_phone:    '+962 7 0000 0000',
  contact_email:    'info@ifluent.io',
  contact_whatsapp: '+962 7 0000 0000',
  social_instagram: null,
  social_facebook:  null,
  social_snapchat:  null,
  social_tiktok:    null,
  app_store_url:    null,
  google_play_url:  null,
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
