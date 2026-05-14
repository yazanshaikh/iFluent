module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // @/ alias is handled automatically by expo/metro-config reading tsconfig.json paths.
    // @ifluent/shared is handled by metro.config.js resolveRequest.
  };
};
