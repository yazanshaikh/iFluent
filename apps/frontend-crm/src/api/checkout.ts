import client from './client';
import publicApi from './publicClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonOption {
  id:    number;
  title: string;
  order: number;
  unit:  { id: number; name: string };
  level: { id: number; code: string; name: string };
}

export interface PurchaseCoursePayload {
  lessons_count:   number;
  amount_paid:     number;
  from_lesson_id?: number | null;
  to_lesson_id?:   number | null;
}

export interface InvoiceCreatedResponse {
  invoice_uuid: string;
  invoice_url:  string;
  payment_account: {
    alias:      string;
    cliq_name:  string;
  };
  lessons_count: number;
  months_count:  number;
  amount_paid:   number;
}

export interface PendingOrder {
  id:            number;
  invoice_uuid:  string | null;
  invoice_url:   string | null;
  status:        string;
  lessons_count: number | null;
  months_count:  number;
  amount_paid:   number;
  from_lesson_id: number | null;
  to_lesson_id:   number | null;
  payment_account: {
    alias:     string;
    cliq_name: string;
  } | null;
  student:      { id: number; name: string } | null;
  submitted_by: { id: number; name: string } | null;
  payment_screenshot_url: string | null;
  created_at:   string;
}

export interface PublicInvoice {
  invoice_uuid:  string;
  student_name:  string;
  lessons_count: number | null;
  months_count:  number;
  amount_due:    number;
  status:        string;
  payment_account: {
    alias:     string;
    cliq_name: string;
  };
  created_at: string;
}

// ─── CRM API (authenticated) ──────────────────────────────────────────────────

export const checkoutApi = {
  /** Generate invoice for a lead — includes optional lesson range */
  purchaseCourse: (leadId: string | number, payload: PurchaseCoursePayload) =>
    client
      .post<InvoiceCreatedResponse>(`/crm/leads/${leadId}/checkout`, payload)
      .then((r) => r.data),

  /** List all pending_screenshot orders */
  listPendingOrders: (page = 1) =>
    client
      .get<{ data: PendingOrder[]; meta: { current_page: number; last_page: number; total: number } }>(
        '/crm/process-orders',
        { params: { page } }
      )
      .then((r) => r.data),

  /** Staff uploads receipt on behalf of customer */
  uploadReceiptForOrder: (subscriptionId: number, file: File) => {
    const form = new FormData();
    form.append('receipt', file);
    return client
      .post(`/crm/process-orders/${subscriptionId}/upload-receipt`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /** Admin: list all pending_approval orders (awaiting admin approval) */
  listPendingApproval: (page = 1) =>
    client
      .get<{ data: PendingOrder[]; meta: { current_page: number; last_page: number; total: number } }>(
        '/admin/subscriptions/pending',
        { params: { page } }
      )
      .then((r) => r.data),

  /** Admin: approve a subscription → activates the student.
   *  from_lesson_id + to_lesson_id define the lesson range for this package.
   *  current_lesson_id is set automatically = from_lesson_id on the backend. */
  approveOrder: (id: number, payload?: { from_lesson_id?: number | null; to_lesson_id?: number | null }) =>
    client.post(`/admin/subscriptions/${id}/approve`, payload ?? {}).then((r) => r.data),

  /** Admin: reject a subscription with optional reason */
  rejectOrder: (id: number, reason?: string) =>
    client.post(`/admin/subscriptions/${id}/reject`, { reason }).then((r) => r.data),

  /** Get current price_per_lesson from public settings */
  getPricePerLesson: () =>
    client
      .get<{ settings: Record<string, unknown> }>('/settings')
      .then((r) => {
        const val = r.data.settings?.price_per_lesson;
        return typeof val === 'number' ? val : 5;
      }),

  /** Admin: update price_per_lesson setting */
  updatePricePerLesson: (price: number) =>
    client
      .patch('/admin/settings', { settings: { price_per_lesson: price } })
      .then((r) => r.data),
};

// ─── Lessons API ─────────────────────────────────────────────────────────────

export const lessonsApi = {
  /** Fetch all active lessons ordered by level → unit → lesson order.
   *  Used in CRM to populate from/to lesson dropdowns. */
  getAll: () =>
    client
      .get<{ data: LessonOption[] }>('/admin/lessons')
      .then((r) => r.data.data),
};

// ─── Public API (no auth) ─────────────────────────────────────────────────────

export const publicInvoiceApi = {
  /** Get invoice details by UUID */
  getInvoice: (uuid: string) =>
    publicApi.get<PublicInvoice>(`/public/invoice/${uuid}`).then((r) => r.data),

  /** Customer uploads receipt */
  uploadReceipt: (uuid: string, file: File) => {
    const form = new FormData();
    form.append('receipt', file);
    return publicApi
      .post<{ message: string }>(`/public/invoice/${uuid}/receipt`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
