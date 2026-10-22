/**
 * iOS/Android: not persisted yet, the token lives in memory until the app is closed.
 * A native release would keep it in expo-secure-store. The web version uses localStorage.
 */
export function readStoredToken(): string | null {
  return null;
}

export function writeStoredToken(_token: string | null): void {}
