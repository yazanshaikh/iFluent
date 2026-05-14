/**
 * Landing App — Booking API
 * Public endpoint — no auth required.
 * POST /api/v1/public/booking → creates a Lead in the DB.
 */
import { apiClient } from './client';
import type { BookingPayload } from '@ifluent/shared';

export async function submitBooking(payload: BookingPayload): Promise<void> {
  await apiClient.post('/public/booking', payload);
}
