import client from './client';
import type { StaffMember } from './staff';

export interface TeacherListItem {
  id:             number;
  name:           string;
  teacher_code:   string | null;
  is_active:      boolean;
  students_count: number;
}

export interface TeacherStudent {
  id:       number;          // students.id
  lead_id:  number | null;
  name:     string;
  phone:    string | null;
  lp:       { id: number; name: string } | null;
  subscription: {
    lessons_count: number | null;
    months_count:  number;
    expires_at:    string | null;
  } | null;
  is_subscribed: boolean;
}

/** Teacher ↔ subscribed-student assignment (admin + LP). */
export const teachersApi = {
  list: () =>
    client.get<{ data: TeacherListItem[] }>('/crm/teachers').then((r) => r.data.data),

  /** Teacher profile (LP gets it without the money fields). */
  get: (id: number) =>
    client.get<StaffMember & { is_active: boolean }>(`/crm/teachers/${id}`).then((r) => r.data),

  students: (id: number) =>
    client.get<{ data: TeacherStudent[] }>(`/crm/teachers/${id}/students`).then((r) => r.data.data),

  unassigned: () =>
    client.get<{ data: TeacherStudent[] }>('/crm/teachers/unassigned-students').then((r) => r.data.data),

  assign: (teacherId: number, studentId: number) =>
    client.post(`/crm/teachers/${teacherId}/students`, { student_id: studentId }).then((r) => r.data),

  unassign: (teacherId: number, studentId: number) =>
    client.delete(`/crm/teachers/${teacherId}/students/${studentId}`).then((r) => r.data),
};
