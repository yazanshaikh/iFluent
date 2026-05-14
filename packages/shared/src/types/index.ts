/**
 * iFluent — Shared TypeScript Types
 * مشتركة بين جميع التطبيقات (Landing, CRM, Student, Teacher)
 */

// ── User roles (must match Laravel RequireRole middleware) ─────────────────
export type UserRole =
  | 'super_admin'
  | 'crm_agent'
  | 'teacher'
  | 'student';

// ── API base response wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data:    T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data:          T[];
  current_page:  number;
  last_page:     number;
  per_page:      number;
  total:         number;
}

// ── Site Settings (public — returned by /api/v1/settings) ────────────────
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

// ── Auth token payload stored in SecureStore ─────────────────────────────
export interface AuthToken {
  token:      string;
  role:       UserRole;
  expires_at?: string;
}

// ── Booking lead (public endpoint) ───────────────────────────────────────
export interface BookingPayload {
  name:           string;
  phone:          string;
  preferred_date: string;
  preferred_hour: number;
  level?:         string;
  message?:       string;
}
