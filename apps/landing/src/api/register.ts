/**
 * Landing App — "سجّل الآن" registration API
 * Public endpoint — no auth required.
 * POST /api/v1/public/leads → creates/updates a Lead (New Leads in the CRM)
 * and attaches the study stage as a system remark.
 */
import { apiClient } from './client';

export interface RegisterPayload {
  name:  string;
  phone: string;
  /** المرحلة الدراسية — Arabic label, one of the STAGES options. */
  stage: string;
}

export const STAGES = [
  'ابتدائي',
  'اعدادي',
  'ثانوي',
  'توجيهي',
  'جامعة',
  'منتهي من الدراسة',
] as const;

export async function submitRegistration(payload: RegisterPayload): Promise<void> {
  await apiClient.post('/public/leads', payload);
}
