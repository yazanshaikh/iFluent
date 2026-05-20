import client from './client';

export interface PaidStudent {
  id: number;
  name: string;
  phone: string;
  converted_at: string | null;
  assigned_to: { id: number; name: string } | null;
  subscription: {
    id: number;
    amount_paid: number;
    months_count: number;
    status: string;
    activated_at: string | null;
    expires_at: string | null;
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
      .get<{ data: PaidStudent[]; meta: PaidStudentsMeta }>('/crm/paid-students', {
        params: filters,
      })
      .then((r) => r.data),
};
