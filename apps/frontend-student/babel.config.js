module.exports = function (api) {
  api.cache(true);
  return {
    // unstable_transformImportMeta: rewrites `import.meta` so ESM-only deps
    // (e.g. zustand v5 uses import.meta.env) don't crash the web bundle with
    // "Cannot use 'import.meta' outside a module". Syntax transform only — it does
    // NOT change module resolution, so iOS/Android behaviour is unaffected.
    // NOTE: do NOT add 'react-native-reanimated/plugin' (or worklets/plugin) here.
    // babel-preset-expo (SDK 54) adds the worklets plugin AUTOMATICALLY when
    // react-native-worklets is installed. Adding it manually runs the worklets
    // transform TWICE → worklets runtime initializes twice → app crashes on launch
    // with "[runtime not ready]: TypeError: property is not writable".
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
