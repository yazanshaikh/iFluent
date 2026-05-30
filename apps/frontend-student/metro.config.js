/**
 * Metro config — Expo SDK 54 + npm workspaces monorepo
 * https://docs.expo.dev/guides/monorepos/
 *
 * Key concern: react-native-reanimated must resolve to ONE copy.
 * The root overrides pin it to 4.1.7, and this config enforces
 * that Metro always walks to the root copy — never a nested one.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot  = __dirname;                          // apps/frontend-student
const monorepoRoot = path.resolve(projectRoot, '../..'); // repo root

const config = getDefaultConfig(projectRoot);

// 1. Watch the full monorepo (root node_modules + other workspaces)
config.watchFolders = [monorepoRoot];

// 2. Module resolution order:
//    First: app-level node_modules (workspace-specific packages)
//    Then:  monorepo root node_modules (shared / hoisted packages)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force singleton native packages to always resolve from the monorepo root.
//    Prevents Metro from picking up a nested copy that npm placed in the
//    workspace's local node_modules when there was a version mismatch.
//    Now that root overrides enforce 4.1.7 everywhere, this is a safety net.
config.resolver.extraNodeModules = {
  'react-native-reanimated':        path.resolve(monorepoRoot, 'node_modules', 'react-native-reanimated'),
  'react-native-gesture-handler':   path.resolve(monorepoRoot, 'node_modules', 'react-native-gesture-handler'),
  'react-native-screens':           path.resolve(monorepoRoot, 'node_modules', 'react-native-screens'),
  'react-native-safe-area-context': path.resolve(monorepoRoot, 'node_modules', 'react-native-safe-area-context'),
  'react':                          path.resolve(monorepoRoot, 'node_modules', 'react'),
  'react-native':                   path.resolve(monorepoRoot, 'node_modules', 'react-native'),
};

// 4. @/ → src/
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
};

module.exports = config;
