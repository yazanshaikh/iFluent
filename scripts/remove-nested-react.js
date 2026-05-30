/**
 * remove-nested-react.js
 *
 * Runs automatically after `npm install` (via "postinstall" in root package.json).
 *
 * Problems this solves:
 *
 *  1. expo-router@4 keeps a nested react@18 to satisfy its peer dep → two React
 *     copies in Metro → hook crash / dispatcher error.
 *
 *  2. Before root `overrides.react-native-reanimated` was added, npm would nest
 *     a second copy of reanimated inside the workspace because the app pinned
 *     ~4.1.1 while root had 4.3.1. Even with overrides, we defensively delete
 *     any local copy to guarantee a single instance for Gradle & Metro.
 *
 * Fix:
 *   Delete nested copies after every install. Metro's hierarchical walk-up then
 *   skips past the missing path and finds the hoisted copy at the monorepo root.
 */

const fs   = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const REMOVE_PATHS = [
  // ── Nested React (expo-router peer dep conflict) ─────────────────────────
  path.join(root, 'apps', 'frontend-student', 'node_modules', 'expo-router', 'node_modules', 'react'),
  path.join(root, 'apps', 'frontend-student', 'node_modules', 'expo-router', 'node_modules', 'react-dom'),

  // ── Nested reanimated ────────────────────────────────────────────────────
  path.join(root, 'apps', 'frontend-student', 'node_modules', 'react-native-reanimated'),
  path.join(root, 'apps', 'frontend-teacher', 'node_modules', 'react-native-reanimated'),
  path.join(root, 'apps', 'ifluent-app',      'node_modules', 'react-native-reanimated'),
  path.join(root, 'apps', 'landing',          'node_modules', 'react-native-reanimated'),

  // ── Nested worklets (must be one version: 0.8.3) ─────────────────────────
  path.join(root, 'apps', 'frontend-student', 'node_modules', 'react-native-worklets'),
  path.join(root, 'apps', 'frontend-teacher', 'node_modules', 'react-native-worklets'),
  path.join(root, 'apps', 'ifluent-app',      'node_modules', 'react-native-worklets'),
  path.join(root, 'apps', 'landing',          'node_modules', 'react-native-worklets'),
];

let removed = 0;

for (const target of REMOVE_PATHS) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[postinstall] removed: ${path.relative(root, target)}`);
    removed++;
  }
}

if (removed === 0) {
  console.log('[postinstall] nothing to remove — dependency tree is clean.');
} else {
  console.log(`[postinstall] cleaned ${removed} nested package(s). Root hoisted copies will be used.`);
}
