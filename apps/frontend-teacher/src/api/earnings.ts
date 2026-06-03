import client from './client';

export interface EarningEntry {
  id:           number;
  session_type: string;
  amount:       number;
  credited_at:  string;
  student_name: string | null;
}

export interface EarningsData {
  total_balance:   number;
  monthly_balance: number;
  history:         EarningEntry[];
}

export const earningsApi = {
  list: () =>
    client.get<EarningsData>('/teacher/earnings').then((r) => r.data),
};
