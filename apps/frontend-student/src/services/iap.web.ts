/**
 * In-app purchase — WEB / DESKTOP stub.
 *
 * react-native-iap is a native module with no web implementation; importing it
 * in the Electron/web bundle would crash at load. Metro picks this file there,
 * so the paid-booking entry points simply hide themselves (isIapSupported).
 */

export const ASSESSMENT_SKU =
  process.env.EXPO_PUBLIC_IAP_ASSESSMENT_PRODUCT_ID ?? 'com.ifluent.student.assessment_session';

export const isIapSupported = false;

export async function getAssessmentPrice(): Promise<string | null> {
  return null;
}

export interface AssessmentPurchase {
  receipt: string;
  finish: () => Promise<void>;
}

export async function purchaseAssessment(): Promise<AssessmentPurchase> {
  throw new Error('الشراء داخل التطبيق متاح على تطبيق الآيفون فقط.');
}
