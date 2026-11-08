import client from './client';

export type CancellationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface CancellationRequest {
  id: number;
  status: CancellationStatus;
  reason: string;
  review_note: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  student: { id: number; lead_id: number | null; name: string | null; phone: string | null };
  subscription: {
    id: number;
    status: string;
    package: string | null;
    amount_paid: number;
    lessons_count: number | null;
    months_count: number;
    activated_at: string | null;
    expires_at: string | null;
  } | null;
  requested_by: { id: number; name: string; role: string } | null;
  reviewed_by: { id: number; name: string } | null;
}

export interface CancellationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

type ListResponse = { data: CancellationRequest[]; meta: CancellationMeta };

export interface CancellationListParams {
  status?:    CancellationStatus;
  phone?:     string;
  page?:      number;
}

export const cancellationRequestsApi = {
  // CC / SS
  create: (subscriptionId: number, reason: string) =>
    client
      .post<{ message: string; data: CancellationRequest }>(
        `/crm/subscriptions/${subscriptionId}/cancellation-requests`,
        { reason },
      )
      .then((r) => r.data),

  mine: (params: CancellationListParams) =>
    client.get<ListResponse>('/crm/cancellation-requests/mine', { params }).then((r) => r.data),

  /** LP pulls back their own pending request (no reason needed). */
  withdraw: (id: number) =>
    client.post<{ message: string }>(`/crm/cancellation-requests/${id}/withdraw`).then((r) => r.data),

  // super_admin
  list: (params: CancellationListParams) =>
    client
      .get<ListResponse & { pending_count: number }>('/admin/cancellation-requests', { params })
      .then((r) => r.data),

  approve: (id: number) =>
    client.post<{ message: string }>(`/admin/cancellation-requests/${id}/approve`).then((r) => r.data),

  reject: (id: number, note?: string) =>
    client.post<{ message: string }>(`/admin/cancellation-requests/${id}/reject`, { note }).then((r) => r.data),
};

export const CANCEL_STATUS_LABEL: Record<CancellationStatus, string> = {
  pending:  'قيد المراجعة',
  approved: 'تم قبول الطلب',
  rejected: 'تم الرفض',
  withdrawn: 'أُلغي من الموظف',
};

export const CANCEL_STATUS_VARIANT: Record<CancellationStatus, 'warning' | 'success' | 'destructive' | 'outline'> = {
  pending:   'warning',
  approved:  'success',
  rejected:  'destructive',
  withdrawn: 'outline',
};
