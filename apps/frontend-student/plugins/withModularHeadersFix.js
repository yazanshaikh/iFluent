/**
 * withModularHeadersFix.js
 *
 * With `useFrameworks: "static"` (required by React Native Firebase), CocoaPods
 * compiles every pod as a framework module, and Clang enforces
 * `-Wnon-modular-include-in-framework-module` as an error (`-Werror`).
 *
 * RNFBApp includes React-Core's `RCTConvert.h` non-modularly, which trips this
 * and fails the Xcode build at "Run fastlane" with:
 *   include of non-modular header inside framework module
 *   'RNFBApp.RCTConvert_FIRApp': '.../React-Core/React/RCTConvert.h'
 *
 * Fix: inject `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES` into
 * the generated Podfile's existing `post_install` block, applied to EVERY pod
 * target. Expo CNG regenerates the Podfile on each prebuild, so this runs as a
 * dangerous mod after the Podfile is generated.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES';

const SNIPPET = [
  '    # Allow non-modular includes in framework modules (RN Firebase + static frameworks)',
  '    installer.pods_project.targets.each do |target|',
  '      target.build_configurations.each do |build_config|',
  "        build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'",
  '      end',
  '    end',
].join('\n');

const withModularHeadersFix = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        console.warn('[withModularHeadersFix] Podfile not found — skipping.');
        return cfg;
      }

      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (contents.includes(MARKER)) {
        return cfg; // already patched — idempotent
      }

      if (/post_install do \|installer\|/.test(contents)) {
        // Inject INTO the existing post_install block (must not add a second one).
        contents = contents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|\n${SNIPPET}\n`,
        );
      } else {
        // No post_install yet (unexpected for Expo) — append one.
        contents += `\npost_install do |installer|\n${SNIPPET}\nend\n`;
      }

      fs.writeFileSync(podfilePath, contents);
      console.log('[withModularHeadersFix] Patched Podfile with CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES.');
      return cfg;
    },
  ]);

module.exports = withModularHeadersFix;
