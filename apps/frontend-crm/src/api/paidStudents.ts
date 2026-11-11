import client from './client';

export interface PaidStudent {
  id: number;
  name: string;
  phone: string;
  converted_at: string | null;
  assigned_to: { id: number; name: string; role: string } | null;
  /** The teacher this student studies with; null when not assigned yet. */
  teacher: { id: number; name: string } | null;
  subscription: {
    id:            number;
    amount_paid:   number;
    lessons_count: number | null;
    months_count:  number;
    status:        string;
    subscription_type?: 'individual' | 'group';
    activated_at:  string | null;
    expires_at:    string | null;
    has_pending_cancellation?: boolean;
    remaining_lessons?: number;
    /** Active package with few lessons left (admin + LP only). */
    is_near_end?: boolean;
  } | null;
}

export interface PaidStudentsFilters {
  phone?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface PaidStudentsMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const paidStudentsApi = {
  list: (filters: PaidStudentsFilters = {}) =>
    client
      .get<{ data: PaidStudent[]; meta: PaidStudentsMeta; lp_staff: { id: number; name: string }[] }>(
        '/crm/paid-students',
        { params: filters },
      )
      .then((r) => r.data),

  /** Sidebar badge: students whose package is ending soon (admin + LP). */
  nearEndCount: () =>
    client.get<{ count: number }>('/crm/paid-students/near-end-count').then((r) => r.data.count),

  /** Admin only — hand a paid student to a follow-up (LP) staff member. Keeps the lead's status. */
  assign: (leadId: number, userId: number) =>
    client
      .post<{ message: string; assigned_to: { id: number; name: string; role: string } }>(
        `/admin/paid-students/${leadId}/assign`,
        { user_id: userId },
      )
      .then((r) => r.data),
};
