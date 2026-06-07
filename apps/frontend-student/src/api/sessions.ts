import client from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionListItem {
  id:                number;
  status:            'waiting' | 'active' | 'completed' | 'cancelled';
  attendance_status: 'attended' | 'absent' | 'teacher_absent' | null;
  scheduled_at:      string | null;
  started_at:        string | null;
  ended_at:          string | null;
  lesson: {
    id:    number;
    title: string;
    order: number;
    unit:  { id: number; name: string; order: number } | null;
    level: { id: number; code: string; name: string };
  };
  teacher: {
    name: string;
  };
}

export interface JoinSessionResponse {
  session_id:      number;
  status:          string;
  daily_room_url:  string;          // load in WebView for Daily.co
  nearpod_pin:     string;          // PIN to enter in Nearpod
  nearpod_url:     string | null;   // URL for the Nearpod WebView
  lesson:          {
    id:            number;
    title:         string;
    is_assessment: boolean;
    order?:        number;
    unit?:         { id: number; name: string; order: number };
    level:         { id: number; code: string; name: string };
  };
  teacher: { name: string };
}

export interface BookingRequest {
  lesson_id?:           number | null;
  scheduled_at:         string;
  teacher_code?:        string;
  teacher_gender_pref?: 'male' | 'female';
  notes?:               string;
}

export interface SessionProfile {
  id:                number;
  status:            'waiting' | 'active' | 'completed' | 'cancelled';
  attendance_status: 'attended' | 'absent' | 'teacher_absent' | null;
  scheduled_at:      string | null;
  started_at:        string | null;
  ended_at:          string | null;
  teacher:           { name: string; teacher_code?: string | null } | null;
  lesson: {
    id:            number;
    title:         string;
    is_assessment: boolean;
    pdf_url:       string | null;
    order?:        number;
    unit?:         { id: number; name: string };
    level?:        { id: number; code: string; name: string };
  };
  quiz_unlocked: boolean;
}

export interface SessionRequest {
  id:           number;
  type:         string;
  status:       'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'expired';
  scheduled_at: string | null;
  lesson: { id: number; title: string } | null;
  teacher: { name: string } | null;
  session_id: number | null;
}

export interface BookingProfile {
  id:           number;
  status:       'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'expired';
  scheduled_at: string | null;
  teacher:      { name: string } | null;
  session_id:   number | null;
  lesson: {
    id:            number;
    title:         string;
    pdf_url:       string | null;
    is_assessment: boolean;
    unit?:         { id: number; name: string };
    level?:        { id: number; code: string; name: string };
  } | null;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const sessionsApi = {
  /** List sessions for the current student */
  listSessions: (status?: string) =>
    client
      .get<{ data: SessionListItem[] }>('/student/sessions', {
        params: status ? { status } : {},
      })
      .then((r) => r.data.data),

  /** Join an active session — returns Daily.co URL + Nearpod data */
  joinSession: (sessionId: number) =>
    client
      .get<JoinSessionResponse>(`/student/sessions/${sessionId}/join`)
      .then((r) => r.data),

  /** List bookings (session requests) */
  listBookings: () =>
    client
      .get<{ data: SessionRequest[] }>('/student/bookings')
      .then((r) => r.data.data),

  /** Book a session (lesson_id optional for quick booking) */
  book: (payload: BookingRequest) =>
    client
      .post<{ message: string; request: SessionRequest }>('/student/bookings', payload)
      .then((r) => r.data),

  /** Fetch session profile (all statuses) */
  getProfile: (sessionId: number) =>
    client
      .get<SessionProfile>(`/student/sessions/${sessionId}/profile`)
      .then((r) => r.data),

  /** Fetch booking request profile (before a session is created) */
  getBookingProfile: (bookingId: number) =>
    client
      .get<BookingProfile>(`/student/bookings/${bookingId}/profile`)
      .then((r) => r.data),

  /** Cancel a booking */
  cancelBooking: (requestId: number) =>
    client
      .post(`/student/bookings/${requestId}/cancel`)
      .then((r) => r.data),
};
