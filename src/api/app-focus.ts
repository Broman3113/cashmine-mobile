import { focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

/**
 * iOS/Android: tell TanStack Query when the app comes back to the foreground, so stale queries
 * (balances, statuses) refetch, like a browser tab regaining focus. Call once at startup.
 * The web version is a no-op: TanStack Query already listens to `visibilitychange` there.
 */
export function listenToAppFocus() {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (state) => setFocused(state === 'active'));
    return () => subscription.remove();
  });
}
