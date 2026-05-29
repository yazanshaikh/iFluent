import client from './client';

export const leadsApi = {
  /**
   * Book a free evaluation session.
   * Creates a SessionRequest (type=demo) linked to the lead's profile
   * so it appears under Trial Bookings in the CRM — not as a new lead.
   */
  bookEval: (data: { name: string; phone: string; scheduled_at: string }) =>
    client.post('/public/eval-booking', data).then((r) => r.data),

  /**
   * Check backend for an active booking by phone.
   * Called on modal open so CRM cancellations are reflected immediately
   * instead of relying on the local SecureStore cache.
   */
  checkBookingStatus: (phone: string) =>
    client
      .get('/public/eval-booking/status', { params: { phone } })
      .then((r) => r.data as { has_active_booking: boolean; scheduled_at?: string }),
};
