/**
 * Screen orientation control for the live-session screen.
 *
 * Uses expo-screen-orientation (a NATIVE module → only present after a fresh
 * dev/standalone build, NOT in Expo Go or an older binary). The module is loaded
 * defensively: if the native side isn't compiled into the running app yet, every
 * helper degrades to a no-op instead of crashing the session screen. Rotation
 * simply won't work until the app is rebuilt — but nothing breaks meanwhile.
 *
 * `allowAll` lets the call screen follow the device sensor so the student can
 * rotate to landscape even if the rest of the app is portrait and even if the
 * system auto-rotate toggle is off.
 */

// Guarded load: requireNativeModule runs at import time inside the package, so a
// static `import` would throw on a binary that lacks the native module. Wrapping
// require lets us fall back to no-ops.
let SO: typeof import('expo-screen-orientation') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SO = require('expo-screen-orientation');
} catch {
  SO = null; // native module not in this build → helpers become no-ops
}

/** Allow every orientation — call screen follows the device sensor. */
export async function allowAll(): Promise<void> {
  try {
    await SO?.unlockAsync();
  } catch { /* unavailable */ }
}

/** Alias kept for existing imports. */
export const unlock = allowAll;

/** Lock to whatever orientation the device is in right now. */
export async function lockCurrent(): Promise<void> {
  if (!SO) return;
  try {
    const current = await SO.getOrientationAsync();
    const isLandscape =
      current === SO.Orientation.LANDSCAPE_LEFT ||
      current === SO.Orientation.LANDSCAPE_RIGHT;

    await SO.lockAsync(
      isLandscape
        ? SO.OrientationLock.LANDSCAPE
        : SO.OrientationLock.PORTRAIT_UP,
    );
  } catch { /* unavailable */ }
}

/** Force landscape — used by the live session so the side-by-side split fits. */
export async function lockLandscape(): Promise<void> {
  try {
    await SO?.lockAsync(SO.OrientationLock.LANDSCAPE);
  } catch { /* unavailable */ }
}

/** Restore the app default (portrait) — call when leaving the session. */
export async function lockPortrait(): Promise<void> {
  try {
    await SO?.lockAsync(SO.OrientationLock.PORTRAIT_UP);
  } catch { /* unavailable */ }
}
