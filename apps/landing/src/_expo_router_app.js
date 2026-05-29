/**
 * Fallback shim — only reached if expo/AppEntry.js is loaded directly
 * (entry set as an absolute path by Expo CLI, bypassing the resolver).
 *
 * expo/AppEntry.js does:
 *   import App from '../../App';        // → monorepo root → crash
 *   registerRootComponent(App);
 *
 * We redirect that import here and export the real expo-router App
 * as default so registerRootComponent gets a valid component.
 */
export { App as default } from 'expo-router/build/qualified-entry';
