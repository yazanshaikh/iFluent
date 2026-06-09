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
  teacher: {
    name:          string;
    teacher_code?: string | null;
    avg_rating?:   number | null;    // ✅ average rating across all sessions
    total_ratings?: number;          // ✅ how many ratings
  } | null;
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
  rating: {                          // ✅ has the student rated this session?
    rated:  boolean;
    stars:  number | null;
    notes:  string | null;
  };
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
  joinSession: (sessionId: number) => {
    console.log(`[SESSIONS-API] joinSession(${sessionId})`);
    return client
      .get<JoinSessionResponse>(`/student/sessions/${sessionId}/join`)
      .then((r) => {
        console.log(`[SESSIONS-API] joinSession(${sessionId}) ✓ hasRoom=${!!r.data.daily_room_url} hasPin=${!!r.data.nearpod_pin}`);
        return r.data;
      })
      .catch((err) => {
        console.error(`[SESSIONS-API] joinSession(${sessionId}) ✗ ${err?.response?.status}`);
        throw err;
      });
  },

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
  getProfile: (sessionId: number) => {
    console.log(`[SESSIONS-API] getProfile(${sessionId})`);
    return client
      .get<SessionProfile>(`/student/sessions/${sessionId}/profile`)
      .then((r) => {
        console.log(`[SESSIONS-API] getProfile(${sessionId}) ✓ status=${r.data.status}`);
        return r.data;
      })
      .catch((err) => {
        console.error(`[SESSIONS-API] getProfile(${sessionId}) ✗ ${err.response?.status}`);
        throw err;
      });
  },

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

  /** Raise hand — notifies the teacher via WebSocket */
  raiseHand: (sessionId: number) =>
    client
      .post(`/student/sessions/${sessionId}/raise-hand`)
      .then((r) => r.data),

  /** Rate the teacher after a completed session */
  rateSession: (sessionId: number, rating: number, notes?: string) =>
    client
      .post(`/student/sessions/${sessionId}/rate`, { rating, notes })
      .then((r) => r.data),

  /** Check if a session has already been rated */
  checkRating: (sessionId: number) =>
    client
      .get<{ rated: boolean; rating: { rating: number; notes: string | null } | null }>(
        `/student/sessions/${sessionId}/rate/check`
      )
      .then((r) => r.data),
};
