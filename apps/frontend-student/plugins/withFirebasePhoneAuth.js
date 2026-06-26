/**
 * withFirebasePhoneAuth.js
 *
 * Expo config plugin — two jobs:
 *
 * 1. Patch GoogleService-Info.plist to add REVERSED_CLIENT_ID if missing.
 *    @react-native-firebase/auth plugin requires this field even for Phone Auth.
 *    We derive it from GOOGLE_APP_ID so the plugin can run without errors.
 *    The URL scheme is only used for reCAPTCHA fallback; APNs-based OTP
 *    (real devices) never touches it.
 *
 * 2. Patch AppDelegate.swift to add FirebaseApp.configure() and canHandleURL.
 *    @react-native-firebase/app plugin prints "Skipping Firebase addition"
 *    for Swift AppDelegates (Expo SDK 54). We add it manually here.
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');
const plist = require('@expo/plist');

// ── Helper: derive REVERSED_CLIENT_ID from GOOGLE_APP_ID ──────────────────
// GOOGLE_APP_ID format : "1:{project}:ios:{hex}"
// REVERSED_CLIENT_ID   : "com.googleusercontent.apps.{project}-{hex}"
function deriveReversedClientId(googleAppId) {
  const parts = (googleAppId ?? '').split(':');
  if (parts.length < 4) return null;
  return `com.googleusercontent.apps.${parts[1]}-${parts[3]}`;
}

// ── Step 1: patch GoogleService-Info.plist (iOS only) ─────────────────────
const withPlistPatch = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const plistPath = path.join(cfg.modRequest.projectRoot, 'GoogleService-Info.plist');
      if (!fs.existsSync(plistPath)) {
        console.warn('[withFirebasePhoneAuth] GoogleService-Info.plist not found — skipping plist patch.');
        return cfg;
      }

      const contents = plist.default.parse(fs.readFileSync(plistPath, 'utf-8'));

      if (!contents['REVERSED_CLIENT_ID']) {
        const derived = deriveReversedClientId(contents['GOOGLE_APP_ID']);
        if (derived) {
          contents['REVERSED_CLIENT_ID'] = derived;
          fs.writeFileSync(plistPath, plist.default.build(contents));
          console.log(`[withFirebasePhoneAuth] Added REVERSED_CLIENT_ID: ${derived}`);
        } else {
          console.warn('[withFirebasePhoneAuth] Could not derive REVERSED_CLIENT_ID.');
        }
      }

      return cfg;
    },
  ]);

// ── Step 2: patch AppDelegate.swift ───────────────────────────────────────
const withAppDelegatePatch = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      // Find AppDelegate.swift
      const iosDir    = path.join(cfg.modRequest.platformProjectRoot);
      const slug      = cfg.modRequest.projectName ?? 'iFluentStudent';
      const delegatePath = path.join(iosDir, slug, 'AppDelegate.swift');

      if (!fs.existsSync(delegatePath)) {
        console.warn(`[withFirebasePhoneAuth] AppDelegate.swift not found at ${delegatePath}`);
        return cfg;
      }

      let src = fs.readFileSync(delegatePath, 'utf-8');

      // ── Add FirebaseAuth import if needed ────────────────────────────────
      // Anchor on 'import Expo' (always in the base template) rather than
      // 'import FirebaseCore' which is added by @react-native-firebase/app
      // AFTER our dangerous-mod runs (LIFO ordering).
      if (!src.includes('import FirebaseAuth')) {
        src = src.replace('import Expo', 'import Expo\nimport FirebaseAuth');
        console.log('[withFirebasePhoneAuth] Added import FirebaseAuth');
      }

      // ── Add FirebaseApp.configure() before factory.startReactNative ──────
      if (!src.includes('FirebaseApp.configure()')) {
        src = src.replace(
          /let delegate = ReactNativeDelegate\(\)/,
          'FirebaseApp.configure()\n    let delegate = ReactNativeDelegate()',
        );
        console.log('[withFirebasePhoneAuth] Added FirebaseApp.configure()');
      }

      // ── Add Auth.auth().canHandle(url) to openURL handler ────────────────
      // Original:  return super.application(app, open: url, ...) || RCTLinkingManager...
      // Patched:   return super... || RCTLinkingManager... || Auth.auth().canHandle(url)
      if (!src.includes('Auth.auth().canHandle(url)')) {
        src = src.replace(
          /return super\.application\(app, open: url, options: options\) \|\| RCTLinkingManager\.application\(app, open: url, options: options\)/,
          'return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options) || Auth.auth().canHandle(url)',
        );
        console.log('[withFirebasePhoneAuth] Added Auth.auth().canHandle(url) to openURL');
      }

      // ── Forward APNs token + silent push to Firebase Auth ─────────────────
      // ROOT CAUSE of the iOS phone-auth crash: Firebase's AppDelegate proxy
      // swizzles the APNs delegate methods, which conflicts with Expo's
      // subscriber-based delegate system (expo-notifications). We disable the
      // proxy (FirebaseAppDelegateProxyEnabled=NO in Info.plist) and forward the
      // APNs token + silent verification push to Firebase Auth MANUALLY, calling
      // `super` so expo-notifications still receives everything. This is the
      // supported way to run Firebase Phone Auth alongside another push handler.
      if (!src.includes('Auth.auth().setAPNSToken')) {
        const apnsMethods = `
  // Firebase Auth — forward APNs token (proxy disabled; super keeps expo-notifications working)
  public override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Auth.auth().setAPNSToken(deviceToken, type: .unknown)
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  // Firebase Auth — intercept the silent phone-verification push
  public override func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    if Auth.auth().canHandleNotification(userInfo) {
      completionHandler(.noData)
      return
    }
    super.application(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: completionHandler)
  }
`;
        src = src.replace(
          /\n}\n\nclass ReactNativeDelegate/,
          `\n${apnsMethods}}\n\nclass ReactNativeDelegate`,
        );
        console.log('[withFirebasePhoneAuth] Added APNs token forwarding for Firebase Auth');
      }

      fs.writeFileSync(delegatePath, src);
      return cfg;
    },
  ]);

// ── Compose both patches ───────────────────────────────────────────────────
const withFirebasePhoneAuth = (config) => {
  config = withPlistPatch(config);
  config = withAppDelegatePatch(config);
  return config;
};

module.exports = withFirebasePhoneAuth;
