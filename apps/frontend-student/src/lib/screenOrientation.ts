/**
 * Screen Orientation stub — Expo Go compatible.
 * expo-screen-orientation requires a native build.
 * In Expo Go we just track state locally (no actual locking).
 */
export async function lockCurrent(): Promise<void> {
  // No-op in Expo Go
}

export async function unlock(): Promise<void> {
  // No-op in Expo Go
}
