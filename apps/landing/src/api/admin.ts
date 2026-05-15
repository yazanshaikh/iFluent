/**
 * Admin API — site settings management + auth.
 * All endpoints require a super_admin Sanctum token (set via saveToken).
 */

import { apiClient, saveToken, clearToken } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id:    number;
  name:  string;
  email: string;
  role:  string;
}

/** One setting entry as returned by GET /admin/settings */
export interface SettingEntry {
  value: string | null;
  type:  'text' | 'image' | 'html' | 'json' | 'boolean';
  label: string | null;
}

/** Grouped settings: { hero: { hero_title: {...}, ... }, contact: {...} } */
export type AdminSettings = Record<string, Record<string, SettingEntry>>;

/** Flat map of key → value used when saving */
export type SettingsPatch = Record<string, string | null>;

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Login with email + password.
 * Returns the user if role === super_admin, throws otherwise.
 */
export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const { data } = await apiClient.post('/crm/auth/login', { email, password });

  if (data.user?.role !== 'super_admin') {
    throw new Error('ليس لديك صلاحية الدخول كمدير.');
  }

  await saveToken(data.token);
  return data.user as AdminUser;
}

export async function adminLogout(): Promise<void> {
  try {
    await apiClient.post('/crm/auth/logout');
  } catch {
    // ignore network errors on logout
  }
  await clearToken();
}

export async function adminMe(): Promise<AdminUser> {
  const { data } = await apiClient.get('/crm/auth/me');
  return data as AdminUser;
}

// ── Settings ──────────────────────────────────────────────────────────────────

/** Fetch all site settings grouped by section */
export async function getAdminSettings(): Promise<AdminSettings> {
  const { data } = await apiClient.get('/admin/settings');
  return data.settings as AdminSettings;
}

/**
 * Save a flat key→value patch.
 * PATCH /admin/settings  { settings: { hero_title: "...", ... } }
 */
export async function patchAdminSettings(patch: SettingsPatch): Promise<void> {
  await apiClient.patch('/admin/settings', { settings: patch });
}

// ── Public Booking ────────────────────────────────────────────────────────────

export interface BookingPayload {
  name:           string;
  phone:          string;
  preferred_date: 'today' | 'tomorrow';
  preferred_hour: number;
  level:          string;
  message?:       string;
}

export async function submitBooking(payload: BookingPayload): Promise<void> {
  await apiClient.post('/public/booking', payload);
}
