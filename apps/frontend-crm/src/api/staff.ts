import api from './client';

/** cc = Client Coordinator (مبيعات) | ss = Sales Support / متابعة | teacher = مدرّس */
export type StaffRole = 'cc' | 'ss' | 'teacher';

export interface StaffMember {
  id:          number;
  name:        string;
  email:       string;
  role:        StaffRole;
  leads_count?: number;
  is_active?:  boolean;
  created_at:  string;
  teacher_profile?: {
    teacher_code:            string;
    bio:                     string | null;
    specialization:          string | null;
    commission_rate:         string;
    balance:                 string | number;
    /** Total sessions: trial + regular. Conversion points are counted separately. */
    sessions_count:          number;
    trial_sessions?:         number;
    regular_sessions?:       number;
    conversion_points?:      number;
    session_commission?:     number;
    conversion_commission?:  number;
    conversion_commission_rate?: number;
    group_sessions?:         number;
    group_commission?:       number;
    group_commission_rate?:  number;
    absences_count:          number;
    avg_rating:              number | null;
    sessions_count_reset_at: string | null;
    balance_reset_at:        string | null;
    absences_reset_at:       string | null;
    is_active:               boolean;
  };
}

export interface TeacherBooking {
  id:           number;
  status:       'pending' | 'confirmed';
  scheduled_at: string;
  lead:         { id: number; name: string; phone: string } | null;
}

export interface CreateStaffPayload {
  name:     string;
  email:    string;
  password: string;
  role:     'cc' | 'ss';
}

export interface CreateTeacherPayload {
  name:             string;
  email:            string;
  password:         string;
  bio?:             string;
  specialization?:  string;
  commission_rate?: number;
}

/** Laravel قد يرجع البيانات مغلفة { data: [...] } أو array مباشر */
interface WrappedOrRaw<T> {
  data?: T;
  [key: string]: unknown;
}

function unwrapArray<T>(res: T[] | WrappedOrRaw<T[]>): T[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as WrappedOrRaw<T[]>).data)) {
    return (res as WrappedOrRaw<T[]>).data!;
  }
  return [];
}

export interface CcSales {
  /** Sales after refunds */
  amount: number;
  gross?: number;
  refunds_deducted?: number;
  count:  number;
  since:  string;
  /** Admin view only */
  due?:           number;
  refund_count?:  number;
  refund_amount?: number;
}

export const staffApi = {
  /** CC: own sales counter */
  mySales: () => api.get<CcSales>('/crm/me/sales').then((r) => r.data),

  /** Admin: a CC's sales counter */
  sales: (id: number) => api.get<CcSales>(`/admin/staff/${id}/sales`).then((r) => r.data),

  addDue: (id: number, amount: number) =>
    api.post<CcSales>(`/admin/staff/${id}/due`, { amount }).then((r) => r.data),
  resetDue: (id: number) => api.post<CcSales>(`/admin/staff/${id}/reset-due`).then((r) => r.data),
  addRefund: (id: number, amount: number) =>
    api.post<CcSales>(`/admin/staff/${id}/refunds`, { amount }).then((r) => r.data),
  resetRefunds: (id: number) => api.post<CcSales>(`/admin/staff/${id}/reset-refunds`).then((r) => r.data),

  /** Admin: start a CC's sales counter again from now */
  resetSales: (id: number) => api.post<CcSales>(`/admin/staff/${id}/reset-sales`).then((r) => r.data),

  list: () =>
    api
      .get<StaffMember[] | WrappedOrRaw<StaffMember[]>>('/admin/staff')
      .then((r) => unwrapArray<StaffMember>(r.data)),

  /**
   * GET /admin/staff/assignable — ACTIVE staff of one role, unpaginated.
   * Leads are assigned to CC only; paid students to LP (ss) only.
   */
  assignable: (role: 'cc' | 'ss' = 'cc') =>
    api
      .get<{ data: { id: number; name: string; role: 'cc' | 'ss' }[] }>('/admin/staff/assignable', { params: { role } })
      .then((r) => r.data.data),

  /** GET /admin/staff/{id} — بروفايل موظف محدد */
  get: (id: number) =>
    api.get<StaffMember>(`/admin/staff/${id}`).then((r) => r.data),

  createCrm: (data: CreateStaffPayload) =>
    api.post<StaffMember>('/admin/staff/crm', data).then((r) => r.data),

  createTeacher: (data: CreateTeacherPayload) =>
    api.post<StaffMember>('/admin/staff/teachers', data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/admin/staff/${id}`).then((r) => r.data),

  resetSessions: (id: number) =>
    api.post<{ message: string; reset_at: string }>(`/admin/staff/${id}/reset-sessions`).then((r) => r.data),

  resetBalance: (id: number) =>
    api.post<{ message: string; reset_at: string }>(`/admin/staff/${id}/reset-balance`).then((r) => r.data),

  /** GET /admin/staff/{id}/demo-bookings — حصص تقييمية محجوزة للمعلم (مستقبلية فقط) */
  teacherDemoBookings: (id: number) =>
    api.get<{ total: number; bookings: TeacherBooking[] }>(`/admin/staff/${id}/demo-bookings`).then((r) => r.data),

  /** PUT /admin/teachers/{id}/commission-rate — تحديث عمولة المعلم */
  updateGroupCommissionRate: (userId: number, rate: number) =>
    api.put(`/admin/teachers/${userId}/commission-rate`, { group_commission_rate: rate }).then((r) => r.data),

  updateConversionCommissionRate: (userId: number, rate: number) =>
    api.put(`/admin/teachers/${userId}/commission-rate`, { conversion_commission_rate: rate }).then((r) => r.data),

  updateCommissionRate: (userId: number, commissionRate: number) =>
    api.put<{ message: string; commission_rate: number }>(
      `/admin/teachers/${userId}/commission-rate`,
      { commission_rate: commissionRate }
    ).then((r) => r.data),
};
