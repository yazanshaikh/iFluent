/**
 * Firebase phone-auth — NATIVE implementation (iOS / Android).
 *
 * Wraps @react-native-firebase/auth behind a tiny platform-agnostic interface so
 * the screens (phone/verify) never import the RN-only SDK directly. Metro resolves
 * `firebaseAuth.web.ts` on web (Firebase JS SDK). Native behaviour is identical to
 * the previous inline calls.
 */
// Modular API (RN Firebase v22+). The old namespaced `auth()` API is deprecated
// and removed in newer majors; modular is the supported path and avoids the
// runtime deprecation warning.
import { getApp } from '@react-native-firebase/app';
import { getAuth, signInWithPhoneNumber, getIdToken } from '@react-native-firebase/auth';

/** Opaque confirmation handle held in memory between the phone & verify screens. */
export interface OtpConfirmation {
  confirm(code: string): Promise<unknown>;
}

/** Send the SMS code (real APNs verification on device; reCAPTCHA fallback). */
export async function sendOtp(e164Phone: string): Promise<OtpConfirmation> {
  return signInWithPhoneNumber(getAuth(getApp()), e164Phone);
}

/** Confirm the code and return the Firebase ID token to exchange with the backend. */
export async function confirmOtp(confirmation: OtpConfirmation, code: string): Promise<string> {
  const credential: any = await confirmation.confirm(code);
  const user = credential?.user ?? getAuth(getApp()).currentUser;
  if (!user) throw new Error('No user after confirmation.');
  return getIdToken(user);
}
