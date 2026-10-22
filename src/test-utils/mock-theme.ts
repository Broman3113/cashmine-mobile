// Lets a test switch the theme. In the test file:
//   jest.mock('@/theme/use-theme', () => ({ useTheme: () => require('@/test-utils/mock-theme').useMockTheme() }));
//   beforeEach(() => setMockColorScheme('dark'));
import type { ColorScheme } from '@/theme/colors';

let scheme: ColorScheme = 'light';

export function setMockColorScheme(next: ColorScheme) {
  scheme = next;
}

export function useMockTheme() {
  const { useTheme } = jest.requireActual('@/theme/use-theme');
  const { colors } = jest.requireActual('@/theme/colors');
  return { ...useTheme(), scheme, colors: colors[scheme] };
}
