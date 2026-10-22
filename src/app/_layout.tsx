import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useState } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { createQueryClient, listenToAppFocus } from '@/api';
import { useTheme } from '@/theme/use-theme';

// Refetch stale queries when the app returns from the background (no-op on web, where tabs already do this).
listenToAppFocus();

export default function RootLayout() {
  // One cache per app instance, created once and kept across re-renders.
  const [queryClient] = useState(createQueryClient);
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

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
          <Stack screenOptions={{ headerShadowVisible: false }} />
        </ThemeProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
