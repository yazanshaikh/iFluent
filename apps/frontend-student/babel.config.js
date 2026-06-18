module.exports = function (api) {
  api.cache(true);
  return {
    // unstable_transformImportMeta: rewrites `import.meta` so ESM-only deps
    // (e.g. zustand v5 uses import.meta.env) don't crash the web bundle with
    // "Cannot use 'import.meta' outside a module". Syntax transform only — it does
    // NOT change module resolution, so iOS/Android behaviour is unaffected.
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: ['react-native-reanimated/plugin'],
  };
};
