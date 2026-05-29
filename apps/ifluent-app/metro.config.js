const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot  = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// ── 1. Watch the whole monorepo so Metro sees packages/shared changes ─────────
config.watchFolders = [monorepoRoot];

// ── 2. Module search order: app → monorepo root ───────────────────────────────
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// ── 3. Resolve @ifluent/shared directly to its TypeScript source ──────────────
const sharedIndex  = path.resolve(monorepoRoot, 'packages/shared/src/index.ts');
const EXPO_APP_SHIM = path.resolve(projectRoot, 'src', '_expo_router_app.js');

const originalResolveRequest = config.resolver.resolveRequest;

// ── 4. Monorepo AppEntry fix + shared package alias ───────────────────────────
//  See apps/frontend-student/metro.config.js for full explanation of the fix.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Shared package — resolve directly to TypeScript source
  if (moduleName === '@ifluent/shared') {
    return { filePath: sharedIndex, type: 'sourceFile' };
  }

  // FIX A: intercept expo/AppEntry however it's referenced (bare or relative path)
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
