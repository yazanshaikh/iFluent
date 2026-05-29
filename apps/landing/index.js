/**
 * Explicit local entry point — monorepo fix.
 *
 * expo is hoisted to the root node_modules. Without this file, Expo CLI
 * falls back to creating a virtual entry that imports:
 *   "./node_modules/expo/AppEntry"  →  expo/AppEntry.js
 * which then does `import App from '../../App'` → monorepo root → crash.
 *
 * Pointing "main" at this local file means Metro sees a concrete path
 * and never falls back to expo/AppEntry.js.
 */
import 'expo-router/entry';
