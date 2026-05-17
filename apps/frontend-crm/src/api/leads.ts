import api from './client';

/**
 * Lead statuses — مطابق لـ Lead model في Laravel:
 *   new            → جديد: في قائمة المدير (غير معيّن) أو قائمة الموظف (معيّن)
 *   in_progress    → قيد التنفيذ: يصنفها الموظف
 *   interested     → مهتم: يصنفها الموظف
 *   not_interested → غير مهتم: يصنفها الموظف
 *   postponed      → تأجيل: يصنفها الموظف
 *   open_sea       → البحر المفتوح: نظام تلقائي
 *   subscriber     → مشترك: نظام بعد الاشتراك
 */
export type LeadStatus =
  | 'new'
  | 'in_progress'
  | 'interested'
  | 'not_interested'
  | 'postponed'
  | 'open_sea'
  | 'subscriber';

export interface Lead {
  id:                  number;
  name:                string;
  phone:               string;
  source:              string | null;
  age:                 number | null;
  status:              LeadStatus;
  assigned_to:         number | null;
  is_small_treasure:   boolean;
  moved_to_open_sea_at: string | null;
  converted_at:        string | null;
  created_at:          string;
  updated_at:          string;
  /** الملاحظات تأتي مع الليد eager-loaded من GET /crm/leads/{id} */
  remarks?: Remark[];
  /** بيانات الموظف المُعيَّن (eager-loaded) */
  assigned_to_user?: { id: number; name: string; role: string } | null;
}

export interface Remark {
  id:         number;
  content:    string;
  created_at: string;
  staff?: { id: number; name: string; role: string };
}

export interface CreateLeadPayload {
  name:         string;
  phone:        string;
  source?:      string;
  age?:         number;
  assigned_to?: number;  // admin: اختياري — إذا لم يُحدد يذهب للـ pool
}

export interface UpdateLeadPayload {
  status?: LeadStatus;
  source?: string;
  age?:    number;
}

export interface LeadsParams {
  page?:              number;
  per_page?:          number;
  search?:            string;
  /** قيمة واحدة أو مصفوفة — الـ backend يدعم whereIn */
  status?:            LeadStatus | LeadStatus[] | '';
  assigned_to?:       number;
  /** unassigned=1 → يُعيد الليدات التي لا موظف عليها (للمدير في New Lead) */
  unassigned?:        1 | 0;
  /** 1 → يُعيد ليدات Small Treasury فقط */
  is_small_treasure?: 1 | 0;
}

/** الحالات التي تظهر في Lead Pool — الحالات المصنّفة فقط (بدون new) */
export const POOL_STATUSES: LeadStatus[] = ['in_progress', 'interested', 'not_interested', 'postponed', 'subscriber'];

export interface LeadsPaginated {
  data:         Lead[];
  current_page: number;
  last_page:    number;
  total:        number;
}

export const leadsApi = {
  list: (params?: LeadsParams) =>
    api.get<LeadsPaginated>('/crm/leads', { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<Lead>(`/crm/leads/${id}`).then((r) => r.data),

  create: (data: CreateLeadPayload) =>
    api.post<Lead>('/crm/leads', data).then((r) => r.data),

  update: (id: number, data: UpdateLeadPayload) =>
    api.put<Lead>(`/crm/leads/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/crm/leads/${id}`).then((r) => r.data),

  /** POST /crm/leads/{lead}/assign — يتوقع { user_id } */
  assign: (leadId: number, userId: number) =>
    api.post<Lead>(`/crm/leads/${leadId}/assign`, { user_id: userId }).then((r) => r.data),

  /** POST /crm/leads/{lead}/recall — يعيد الليد لـ pool المدير (status: new) */
  recall: (leadId: number) =>
    api.post<Lead>(`/crm/leads/${leadId}/recall`).then((r) => r.data),

  /* ── Remarks ──
     لا يوجد GET منفصل — الملاحظات تأتي مع lead_remarks في GET /crm/leads/{id}
     POST /crm/leads/{lead}/remarks → إضافة ملاحظة                        */
  toggleSmallTreasure: (leadId: number) =>
    api.post<{ is_small_treasure: boolean; message: string }>(
      `/crm/leads/${leadId}/small-treasure`,
    ).then((r) => r.data),

  addRemark: (leadId: number, content: string) =>
    api.post<Remark>(`/crm/leads/${leadId}/remarks`, { content }).then((r) => r.data),
};
