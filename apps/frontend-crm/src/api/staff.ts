import api from './client';

/** cc = Client Coordinator (مبيعات) | ss = Sales Support / متابعة | teacher = مدرّس */
export type StaffRole = 'cc' | 'ss' | 'teacher';

export interface StaffMember {
  id:          number;
  name:        string;
  email:       string;
  role:        StaffRole;
  leads_count?: number;
  created_at:  string;
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

export const staffApi = {
  list: () =>
    api
      .get<StaffMember[] | WrappedOrRaw<StaffMember[]>>('/admin/staff')
      .then((r) => unwrapArray<StaffMember>(r.data)),

  /** GET /admin/staff/{id} — بروفايل موظف محدد */
  get: (id: number) =>
    api.get<StaffMember>(`/admin/staff/${id}`).then((r) => r.data),

  createCrm: (data: CreateStaffPayload) =>
    api.post<StaffMember>('/admin/staff/crm', data).then((r) => r.data),

  createTeacher: (data: CreateTeacherPayload) =>
    api.post<StaffMember>('/admin/staff/teachers', data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/admin/staff/${id}`).then((r) => r.data),
};
