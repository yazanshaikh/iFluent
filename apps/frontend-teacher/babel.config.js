module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    // NOTE: no manual 'react-native-reanimated/plugin' here — babel-preset-expo
    // (SDK 54) auto-adds the worklets plugin; adding it manually doubles it and
    // crashes/hangs the app on launch ("property is not writable"), the same bug
    // we fixed in the student app.
  };
};
