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

export interface DemoSession {
  id:           number;
  status:       'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'expired';
  scheduled_at: string;
  lesson?:      { id: number; title: string } | null;
  teacher?:     { name: string } | null;
  /** بيانات الحضور — تُعبأ فقط عند وجود جلسة مرتبطة (session_id موجود) */
  attendance?:  {
    teacher_joined: boolean;
    student_joined: boolean;
    ended_at: string | null;
  } | null;
}

export interface DemoBooking {
  id:           number;
  status:       'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'expired';
  scheduled_at: string;
  created_at:   string;
  lead: { id: number; name: string; phone: string } | null;
  assigned_to:  { id: number; name: string; role: string } | null;
}

export interface Lead {
  id:                  number;
  name:                string;
  phone:               string;
  source:              string | null;
  age:                 number | null;
  status:              LeadStatus;
  /** الموظف المُعيَّن — object عند تحميل العلاقة (في بروفايل الليد والقوائم) */
  assigned_to:         { id: number; name: string; role: string } | null;
  is_small_treasure:   boolean;
  moved_to_open_sea_at: string | null;
  converted_at:        string | null;
  converted_by:        { id: number; name: string } | null;
  active_subscription?: {
    activated_at:  string | null;
    amount_paid:   number;
    lessons_count: number | null;
    from_lesson:   { id: number; title: string } | null;
    to_lesson:     { id: number; title: string } | null;
  } | null;
  created_at:          string;
  updated_at:          string;
  /** الملاحظات تأتي مع الليد eager-loaded من GET /crm/leads/{id} */
  remarks?: Remark[];
  demo_session?: DemoSession | null;
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
  /** YYYY-MM-DD → فلتر بتاريخ الإضافة */
  date?: string;
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

  getDemoRequests: (leadId: number) =>
    api.get<{ requests: DemoSession[] }>(`/crm/leads/${leadId}/demo-requests`).then(r => r.data),

  bookDemo: (leadId: number, payload: { scheduled_at: string; notes?: string }) =>
    api.post<{ message: string; request: DemoSession }>(`/crm/leads/${leadId}/demo-requests`, payload).then(r => r.data),

  cancelDemo: (sessionRequestId: number) =>
    api.post<{ message: string }>(`/crm/demo-requests/${sessionRequestId}/cancel`).then(r => r.data),

  changeDemoLesson: (sessionRequestId: number, lessonId: number) =>
    api.patch<{ message: string; lesson: { id: number; title: string } }>(
      `/crm/demo-requests/${sessionRequestId}/change-lesson`,
      { lesson_id: lessonId }
    ).then(r => r.data),

  /** GET /crm/demo-bookings — all demo sessions (CC: own leads; admin: all) */
  listDemoBookings: (params: {
    page?:      number;
    status?:    string;
    search?:    string;
    date_from?: string;   // YYYY-MM-DD
    date_to?:   string;   // YYYY-MM-DD
  }) =>
    api.get<{
      data: DemoBooking[];
      total: number;
      current_page: number;
      last_page: number;
    }>('/crm/demo-bookings', { params }).then(r => r.data),
};
