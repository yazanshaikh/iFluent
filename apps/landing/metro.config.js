const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root — two levels up from apps/landing
const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// ── 1. Watch the whole monorepo so Metro sees packages/shared changes ─────────
config.watchFolders = [monorepoRoot];

// ── 2. Module search order: app → monorepo root ───────────────────────────────
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname,    'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// ── 3. Resolve @ifluent/shared directly to its TypeScript source ──────────────
//    extraNodeModules expects a *directory* — we use resolveRequest instead,
//    which lets us return the exact source file path.
const sharedIndex = path.resolve(monorepoRoot, 'packages/shared/src/index.ts');

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@ifluent/shared') {
    return { filePath: sharedIndex, type: 'sourceFile' };
  }
  // Fall through to default Metro resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
