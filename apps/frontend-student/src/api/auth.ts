import client from './client';

export interface AuthUser {
  id:    number;
  name:  string;
  phone: string;
  role:  string;
}

// ── Firebase flow ──────────────────────────────────────────────────────────

export interface CheckPhoneResponse {
  exists: boolean;
}

export interface RegisterResponse {
  message: string;
}

export interface FirebaseVerifyResponse {
  token: string;
  user:  AuthUser;
}

// ── Legacy OTP flow (local dev / fallback) ─────────────────────────────────

export interface SendOtpResponse {
  message: string;
  code?:   string; // only in local environment
}

export interface VerifyOtpResponse {
  token: string;
  user:  AuthUser;
}

// ── API ────────────────────────────────────────────────────────────────────

export const authApi = {
  // ── Firebase flow ──────────────────────────────────────────────────────

  /** Check if a phone number is registered in the system */
  checkPhone: (phone: string) =>
    client
      .post<CheckPhoneResponse>('/auth/check-phone', { phone })
      .then((r) => r.data),

  /** Self-register a new student (creates Lead + User in backend) */
  register: (name: string, phone: string) =>
    client
      .post<RegisterResponse>('/auth/register', { name, phone })
      .then((r) => r.data),

  /** Exchange a Firebase IdToken for a Sanctum token */
  firebaseVerify: (idToken: string) =>
    client
      .post<FirebaseVerifyResponse>('/auth/firebase-verify', { id_token: idToken })
      .then((r) => r.data),

  // ── Legacy OTP (local dev fallback) ────────────────────────────────────

  sendOtp: (phone: string) =>
    client
      .post<SendOtpResponse>('/auth/send-otp', { phone })
      .then((r) => r.data),

  verifyOtp: (phone: string, code: string, name?: string) =>
    client
      .post<VerifyOtpResponse>('/auth/verify-otp', { phone, code, name })
      .then((r) => r.data),

  /** Logout: revoke current Sanctum token */
  logout: () =>
    client.post('/auth/logout').then((r) => r.data),

  /** Secret code login — bypass SMS for internal testing */
  secretLogin: (phone: string, secret: string) =>
    client
      .post<FirebaseVerifyResponse>('/auth/secret-login', { phone, secret })
      .then((r) => r.data),
};
