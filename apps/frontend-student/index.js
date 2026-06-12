/**
 * Explicit local entry point — monorepo fix.
 *
 * expo is hoisted to the root node_modules. Without this file, Expo CLI
 * falls back to a virtual entry that imports "../../App" → monorepo root → crash.
 * Pointing "main" at this concrete file prevents that fallback.
 */
import 'expo-router/entry';
