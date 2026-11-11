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
import { getAuth, signInWithPhoneNumber, getIdToken, onAuthStateChanged, signOut } from '@react-native-firebase/auth';

/** Opaque confirmation handle held in memory between the phone & verify screens. */
export interface OtpConfirmation {
  confirm(code: string): Promise<unknown>;
}

/** Send the SMS code (real APNs verification on device; reCAPTCHA fallback). */
export async function sendOtp(e164Phone: string): Promise<OtpConfirmation> {
  const auth = getAuth(getApp());
  // Drop any earlier Firebase sign-in, so a signed-in user seen after this point
  // can only come from this verification (see onOtpAutoVerified).
  if (auth.currentUser) await signOut(auth).catch(() => {});
  return signInWithPhoneNumber(auth, e164Phone);
}

/** Confirm the code and return the Firebase ID token to exchange with the backend. */
export async function confirmOtp(confirmation: OtpConfirmation, code: string): Promise<string> {
  const auth = getAuth(getApp());
  try {
    const credential: any = await confirmation.confirm(code);
    const user = credential?.user ?? auth.currentUser;
    if (!user) throw new Error('No user after confirmation.');
    return getIdToken(user);
  } catch (err) {
    // Android may read the SMS itself and sign the user in first; the code then
    // fails as "invalid" even though the phone is verified.
    if (auth.currentUser) return getIdToken(auth.currentUser);
    throw err;
  }
}

/**
 * Android can verify the SMS automatically, without the code being typed.
 * Calls back with the ID token when that happens. Returns an unsubscribe.
 */
export function onOtpAutoVerified(onToken: (idToken: string) => void): () => void {
  return onAuthStateChanged(getAuth(getApp()), (user) => {
    if (user) getIdToken(user).then(onToken).catch(() => {});
  });
}
