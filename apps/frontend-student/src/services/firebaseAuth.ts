/**
 * Firebase phone-auth — NATIVE implementation (iOS / Android).
 *
 * Wraps @react-native-firebase/auth behind a tiny platform-agnostic interface so
 * the screens (phone/verify) never import the RN-only SDK directly. Metro resolves
 * `firebaseAuth.web.ts` on web (Firebase JS SDK). Native behaviour is identical to
 * the previous inline calls.
 */
import auth from '@react-native-firebase/auth';

/** Opaque confirmation handle held in memory between the phone & verify screens. */
export interface OtpConfirmation {
  confirm(code: string): Promise<unknown>;
}

/** Send the SMS code (runs Play Integrity / reCAPTCHA via the native SDK). */
export async function sendOtp(e164Phone: string): Promise<OtpConfirmation> {
  // DEV only: skip APNs/reCAPTCHA app-verification so Firebase "test phone
  // numbers" work on a real device BEFORE the APNs key is uploaded to Firebase.
  // Without this, signInWithPhoneNumber attempts APNs verification even for test
  // numbers and hard-crashes the app. Has NO effect in production (__DEV__=false),
  // and only succeeds for numbers registered under Firebase Auth → "Phone numbers
  // for testing". Real numbers still require a real APNs key + Apple approval.
  if (__DEV__) {
    auth().settings.appVerificationDisabledForTesting = true;
  }
  return auth().signInWithPhoneNumber(e164Phone);
}

/** Confirm the code and return the Firebase ID token to exchange with the backend. */
export async function confirmOtp(confirmation: OtpConfirmation, code: string): Promise<string> {
  const credential: any = await confirmation.confirm(code);
  const user = credential?.user ?? auth().currentUser;
  if (!user) throw new Error('No user after confirmation.');
  return user.getIdToken();
}
