const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot  = __dirname;                          // apps/landing
const monorepoRoot = path.resolve(projectRoot, '../..'); // repo root

const config = getDefaultConfig(projectRoot);

// ── 0. Bundle PDFs as assets (e.g. the platform policies file) ────────────────
if (!config.resolver.assetExts.includes('pdf')) {
  config.resolver.assetExts.push('pdf');
}

// ── 1. Watch the whole monorepo ───────────────────────────────────────────────
config.watchFolders = [monorepoRoot];

// ── 2. Module search order: app → monorepo root ───────────────────────────────
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot,  'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// ── 3. Shared package alias ───────────────────────────────────────────────────
const sharedIndex   = path.resolve(monorepoRoot, 'packages/shared/src/index.ts');

// ── 4. Monorepo AppEntry fix ──────────────────────────────────────────────────
//
//  Problem: `expo` is hoisted to root node_modules.
//  Expo CLI creates a virtual entry:
//    import "./node_modules/expo/AppEntry"   ← relative path
//  expo/AppEntry.js then does:
//    import App from '../../App'  →  /monorepo-root/App  →  MISSING  →  crash
//
//  FIX A — catch expo/AppEntry before it loads (handles both the relative-path
//           form "./node_modules/expo/AppEntry" AND the bare "expo/AppEntry").
//           Redirect straight to expo-router/entry.
//
//  FIX B — fallback: if AppEntry IS loaded as an absolute path (bypassing the
//           resolver), intercept the '../../App' import from inside it and
//           return our shim that re-exports the expo-router App as default.
// ─────────────────────────────────────────────────────────────────────────────

const EXPO_APP_SHIM = path.resolve(projectRoot, 'src', '_expo_router_app.js');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Shared package
  if (moduleName === '@ifluent/shared') {
    return { filePath: sharedIndex, type: 'sourceFile' };
  }

  // FIX A: intercept expo/AppEntry however Metro references it
  if (
    moduleName === 'expo/AppEntry' ||
    moduleName.endsWith('/expo/AppEntry') ||
    moduleName.endsWith('\\expo\\AppEntry')
  ) {
    return context.resolveRequest(context, 'expo-router/entry', platform);
  }

  // FIX B: intercept '../../App' imported from inside expo/AppEntry.js
  const origin = context.originModulePath ?? '';
  if (
    moduleName === '../../App' &&
    (origin.endsWith(`expo${path.sep}AppEntry.js`) ||
     origin.endsWith('expo/AppEntry.js'))
  ) {
    return { filePath: EXPO_APP_SHIM, type: 'sourceFile' };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
