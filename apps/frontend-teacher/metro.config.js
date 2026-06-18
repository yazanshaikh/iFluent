const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot  = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  'react-native-reanimated':        path.resolve(monorepoRoot, 'node_modules', 'react-native-reanimated'),
  'react-native-gesture-handler':   path.resolve(monorepoRoot, 'node_modules', 'react-native-gesture-handler'),
  'react-native-screens':           path.resolve(monorepoRoot, 'node_modules', 'react-native-screens'),
  'react-native-safe-area-context': path.resolve(monorepoRoot, 'node_modules', 'react-native-safe-area-context'),
  'react':                          path.resolve(monorepoRoot, 'node_modules', 'react'),
  'react-native':                   path.resolve(monorepoRoot, 'node_modules', 'react-native'),
};

config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
};

// ── Keep native-only modules OUT of the web bundle ────────────────────────────
// On web, @daily-co/react-native-daily-js (and its react-native-webrtc dep) crash
// the bundle. Web code paths use the Daily Web SDK instead via *.web files, but
// this resolver is the hard guarantee that the RN-only packages are never bundled
// for web even through a transitive import. Native resolution is untouched.
const EMPTY_MODULE = path.resolve(projectRoot, 'src', 'empty-module.js');
const WEB_EXCLUDED = new Set([
  '@daily-co/react-native-daily-js',
  '@daily-co/react-native-webrtc',
  'react-native-background-timer',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_EXCLUDED.has(moduleName)) {
    return { type: 'sourceFile', filePath: EMPTY_MODULE };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
