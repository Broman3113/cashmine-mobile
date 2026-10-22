import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { createQueryClient, listenToAppFocus, subscribeToToken, useTokenState } from '@/api';
import { clearInFlightClaims } from '@/features/balances';
import { useTheme } from '@/theme/use-theme';

// Refetch stale queries when the app returns from the background (no-op on web, where tabs already do this).
listenToAppFocus();

export default function RootLayout() {
  // One cache per app instance, created once and kept across re-renders.
  const [queryClient] = useState(createQueryClient);
  const { token } = useTokenState();
  const hasToken = token !== null;
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  // Data is private to each token: whenever it changes (new token, change, 401), nothing cached may carry over.
  useEffect(
    () =>
      subscribeToToken(() => {
        void queryClient.cancelQueries();
        queryClient.clear();
        clearInFlightClaims();
      }),
    [queryClient],
  );

  // Navigation theme: colors for headers, screen background and borders drawn by the navigator.
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.brand,
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.borderDefault,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      {/* Keyboard events for Screen's KeyboardAwareScrollView / KeyboardStickyView (no-op on web). */}
      <KeyboardProvider>
        <ThemeProvider value={navigationTheme}>
          {/* Routes not listed here are not guarded: every screen that calls the API goes in the first group. */}
          <Stack screenOptions={{ headerShadowVisible: false }}>
            <Stack.Protected guard={hasToken}>
              <Stack.Screen name="index" />
              <Stack.Screen name="claim" />
              <Stack.Screen name="claims/[id]" />
            </Stack.Protected>
            <Stack.Protected guard={!hasToken}>
              <Stack.Screen name="token" options={{ title: 'API token' }} />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
