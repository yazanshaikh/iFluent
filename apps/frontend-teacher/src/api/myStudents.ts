import client from './client';

export interface MyStudent {
  id:                number;
  name:              string;
  remaining_lessons: number;
}

/** Students assigned to this teacher from the CRM. */
export const myStudentsApi = {
  list: () => client.get<{ data: MyStudent[] }>('/teacher/my-students').then((r) => r.data.data),

  /** Sends the student back to the CRM's "no teacher" list. */
  remove: (studentId: number) =>
    client.delete<{ message: string }>(`/teacher/my-students/${studentId}`).then((r) => r.data),
};
