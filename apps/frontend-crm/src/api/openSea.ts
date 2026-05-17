import api from './client';
import type { Lead, Remark } from './leads';

export interface OpenSeaLead extends Lead {
  moved_to_open_sea_at: string;
  lead_remarks:         Remark[];
}

export interface OpenSeaParams {
  page?:      number;
  per_page?:  number;   // 10 ثابتة
  phone?:     string;   // بحث برقم الجوال
  date_from?: string;   // فلتر التاريخ من (YYYY-MM-DD)
  date_to?:   string;   // فلتر التاريخ الى (YYYY-MM-DD)
}

export interface OpenSeaPaginated {
  data:         OpenSeaLead[];
  current_page: number;
  last_page:    number;
  total:        number;
}

/** يعالج كلا الحالتين: paginated { data:[...] } أو array مباشر */
function normalise(raw: unknown): OpenSeaPaginated {
  if (Array.isArray(raw)) {
    return { data: raw as OpenSeaLead[], current_page: 1, last_page: 1, total: raw.length };
  }
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj['data'])) {
    return {
      data:         obj['data'] as OpenSeaLead[],
      current_page: (obj['current_page'] as number) ?? 1,
      last_page:    (obj['last_page']    as number) ?? 1,
      total:        (obj['total']        as number) ?? (obj['data'] as unknown[]).length,
    };
  }
  return { data: [], current_page: 1, last_page: 1, total: 0 };
}

export const openSeaApi = {
  /** GET /crm/leads/open-sea */
  list: (params?: OpenSeaParams) =>
    api.get('/crm/leads/open-sea', { params }).then((r) => normalise(r.data)),

  /** Self-pull: POST /crm/leads/{id}/pull-from-sea */
  pull: (id: number) =>
    api.post<Lead>(`/crm/leads/${id}/pull-from-sea`).then((r) => r.data),

  /** Admin re-assign: POST /crm/leads/{id}/assign — يتوقع { user_id } */
  assign: (id: number, userId: number) =>
    api.post<Lead>(`/crm/leads/${id}/assign`, { user_id: userId }).then((r) => r.data),
};
