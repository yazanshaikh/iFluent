/**
 * In-app purchase — NATIVE (iOS / StoreKit).
 *
 * Only the paid assessment session goes through here. Android is intentionally
 * unsupported for now: Google Play requires its own billing integration, and
 * shipping a purchase button without it would get the app rejected there.
 * Metro resolves `iap.web.ts` on web/desktop, which reports "unavailable".
 *
 * Ordering matters: we hand the receipt to OUR server first and only finish the
 * StoreKit transaction after the booking exists. Finishing early would consume
 * the purchase even if the booking failed — the student would have paid for
 * nothing.
 */
import { Platform } from 'react-native';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getReceiptDataIOS,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';

/** Must match the Consumable product in App Store Connect. */
export const ASSESSMENT_SKU =
  process.env.EXPO_PUBLIC_IAP_ASSESSMENT_PRODUCT_ID ?? 'com.ifluent.student.assessment_session';

/** StoreKit only ships on iOS here. */
export const isIapSupported = Platform.OS === 'ios';

let connected = false;

async function connect(): Promise<void> {
  if (connected) return;
  await initConnection();
  connected = true;
}

/**
 * The store's own localized price string (e.g. "JOD 1.99"), or null when the
 * product can't be read — callers fall back to their hardcoded label.
 */
export async function getAssessmentPrice(): Promise<string | null> {
  if (!isIapSupported) return null;

  try {
    await connect();
    // fetchProducts can resolve null when the store has nothing to return.
    const products = (await fetchProducts({ skus: [ASSESSMENT_SKU], type: 'in-app' } as any)) as any[] | null;
    const product = products?.find((p) => (p?.id ?? p?.productId) === ASSESSMENT_SKU) ?? products?.[0];

    return product?.displayPrice ?? product?.localizedPrice ?? null;
  } catch {
    return null;
  }
}

export interface AssessmentPurchase {
  /** Base64 App Store receipt — the server re-verifies this with Apple. */
  receipt: string;
  /** Call ONLY after the server confirmed the booking. */
  finish: () => Promise<void>;
}

/**
 * Runs the StoreKit purchase and resolves once the transaction is in hand.
 * Rejects with a user-presentable message (including a plain cancel).
 */
export async function purchaseAssessment(): Promise<AssessmentPurchase> {
  if (!isIapSupported) {
    throw new Error('الشراء داخل التطبيق غير متاح على هذا الجهاز.');
  }

  await connect();

  return new Promise<AssessmentPurchase>((resolve, reject) => {
    let settled = false;

    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      updateSub.remove();
      errorSub.remove();
      fn();
    };

    const updateSub = purchaseUpdatedListener(async (purchase: any) => {
      try {
        // StoreKit 2 hands back a JWS; our server validates the classic receipt,
        // so read that explicitly rather than trusting a field on `purchase`.
        const receipt = await getReceiptDataIOS();

        if (!receipt) throw new Error('تعذّر قراءة إيصال الشراء.');

        done(() =>
          resolve({
            receipt,
            finish: () => finishTransaction({ purchase, isConsumable: true } as any),
          }),
        );
      } catch (e: any) {
        done(() => reject(new Error(e?.message ?? 'تعذّر إتمام عملية الشراء.')));
      }
    });

    const errorSub = purchaseErrorListener((err: any) => {
      const cancelled = String(err?.code ?? '').toLowerCase().includes('cancel');

      done(() =>
        reject(new Error(cancelled ? 'تم إلغاء عملية الشراء.' : (err?.message ?? 'فشلت عملية الشراء.'))),
      );
    });

    requestPurchase({ request: { ios: { sku: ASSESSMENT_SKU } }, type: 'in-app' } as any)
      .catch((e: any) => done(() => reject(new Error(e?.message ?? 'تعذّر بدء عملية الشراء.'))));
  });
}
