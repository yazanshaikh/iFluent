import client from './client';

export const leadsApi = {
  bookEval: (data: { name: string; phone: string; scheduled_at: string }) =>
    client.post('/public/leads', data).then((r) => r.data),
};
