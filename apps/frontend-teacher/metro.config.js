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

module.exports = config;
