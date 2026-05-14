const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root — two levels up from apps/landing
const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// ── Monorepo: watch packages/shared ──────────────────────────────────────────
config.watchFolders = [monorepoRoot];

// ── Resolve: prefer app node_modules, then monorepo root node_modules ────────
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname,  'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// ── Resolve @ifluent/shared to local source ───────────────────────────────────
config.resolver.extraNodeModules = {
  '@ifluent/shared': path.resolve(monorepoRoot, 'packages/shared/src/index.ts'),
};

module.exports = config;
