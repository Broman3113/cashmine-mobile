import { useColorScheme } from 'react-native';

import { colors, type ColorScheme } from './colors';

/**
 * Theme values that change with the device's light/dark setting.
 * Static tokens (spacing, radius, typography) are imported directly from '@/theme/*',
 * so they also work in StyleSheet.create outside components.
 */
export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colors[scheme] };
}
