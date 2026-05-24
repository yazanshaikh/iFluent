/**
 * Metro config — Expo SDK 54 + npm workspaces monorepo
 * https://docs.expo.dev/guides/monorepos/
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot  = __dirname;                          // apps/frontend-student
const monorepoRoot = path.resolve(projectRoot, '../..'); // repo root

const config = getDefaultConfig(projectRoot);

// 1. Watch the full monorepo (root node_modules + other workspaces)
config.watchFolders = [monorepoRoot];

// 2. Where Metro looks for packages:
//    - workspace first (anything not hoisted lives here)
//    - monorepo root second (react, react-native, expo, zustand, axios …)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. @/ → src/
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
};

module.exports = config;
