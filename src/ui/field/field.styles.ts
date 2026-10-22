import { StyleSheet } from 'react-native';

import type { Colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export const FIELD_HEIGHT = 48;

export type FieldState = { isFocused: boolean; isInvalid: boolean };

/** Border shows the state: error wins over focus, so an invalid field stays red while editing. */
export function getBorderColor(colors: Colors, { isFocused, isInvalid }: FieldState): string {
  if (isInvalid) return colors.borderError;
  if (isFocused) return colors.borderAccent;
  return 'transparent';
}

export const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.s },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: FIELD_HEIGHT,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  disabled: { opacity: 0.6 },
  input: {
    flex: 1,
    // 16px minimum: iOS Safari zooms the whole page when a smaller input gets focus.
    fontSize: typography.body.fontSize,
    paddingVertical: spacing.md,
    // The box border is the focus indicator; drop the browser's default outline.
    // 'solid' is needed: with the browser's default `outline-style: auto`, Chrome ignores a zero width.
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
});
