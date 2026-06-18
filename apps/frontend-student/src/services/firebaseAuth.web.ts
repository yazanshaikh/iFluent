/**
 * Firebase phone-auth — WEB / DESKTOP implementation (Firebase JS SDK).
 *
 * Same interface as `firebaseAuth.ts` so the screens are platform-agnostic.
 * Phone auth on web requires an (invisible) reCAPTCHA — we create a hidden
 * container in the DOM so the screens don't need to render anything.
 *
 * Config comes from EXPO_PUBLIC_FIREBASE_* (a Web app in the Firebase console).
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, RecaptchaVerifier, signInWithPhoneNumber,
  type Auth, type ConfirmationResult,
} from 'firebase/auth';

export interface OtpConfirmation {
  confirm(code: string): Promise<unknown>;
}

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID,
};

function ensureApp(): FirebaseApp {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    throw new Error('تسجيل الدخول عبر الويب غير مُهيّأ بعد (إعدادات Firebase ناقصة).');
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
}

let verifier: RecaptchaVerifier | null = null;
function getVerifier(a: Auth): RecaptchaVerifier {
  if (!verifier) {
    let el = document.getElementById('recaptcha-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'recaptcha-container';
      // NOTE: must NOT be display:none — an invisible reCAPTCHA can't execute in
      // a hidden container (causes a 400 MISSING_CLIENT_IDENTIFIER). Keep it
      // rendered but parked off the layout; Google shows its badge bottom-right.
      el.style.position = 'fixed';
      el.style.bottom = '0';
      el.style.right = '0';
      el.style.zIndex = '-1';
      document.body.appendChild(el);
    }
    verifier = new RecaptchaVerifier(a, el, { size: 'invisible' });
  }
  return verifier;
}

export async function sendOtp(e164Phone: string): Promise<OtpConfirmation> {
  const a = getAuth(ensureApp());
  try {
    return await signInWithPhoneNumber(a, e164Phone, getVerifier(a));
  } catch (e: any) {
    console.error('[firebaseAuth.web] sendOtp failed:', e?.code, e?.message);
    throw e;
  }
}

export async function confirmOtp(confirmation: OtpConfirmation, code: string): Promise<string> {
  const credential = await (confirmation as ConfirmationResult).confirm(code);
  return credential.user.getIdToken();
}
