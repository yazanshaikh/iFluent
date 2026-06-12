/**
 * withBackgroundTimerNamespace.js
 *
 * `react-native-background-timer` (a required peer dep of @daily-co/react-native-daily-js)
 * is unmaintained and ships an android/build.gradle WITHOUT a `namespace`.
 * Android Gradle Plugin 8 (Expo SDK 54) REQUIRES a namespace, so the Gradle
 * build fails. This plugin injects the namespace into the library's build.gradle
 * during prebuild (runs on EAS before `gradlew`), so no patch-package needed.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs   = require('fs');
const path = require('path');

const NAMESPACE = 'com.ocetnik.timer'; // from the lib's AndroidManifest package

module.exports = function withBackgroundTimerNamespace(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      try {
        // Resolve the (possibly hoisted, monorepo) location of the package
        const pkgJson = require.resolve('react-native-background-timer/package.json', {
          paths: [cfg.modRequest.projectRoot],
        });
        const gradlePath = path.join(path.dirname(pkgJson), 'android', 'build.gradle');

        if (fs.existsSync(gradlePath)) {
          let contents = fs.readFileSync(gradlePath, 'utf8');
          if (!/\bnamespace\b/.test(contents)) {
            contents = contents.replace(/android\s*\{/, `android {\n    namespace "${NAMESPACE}"`);
            fs.writeFileSync(gradlePath, contents, 'utf8');
            console.log('[withBackgroundTimerNamespace] injected namespace into', gradlePath);
          }
        }
      } catch (e) {
        console.warn('[withBackgroundTimerNamespace] skipped:', e.message);
      }
      return cfg;
    },
  ]);
};
