import { StyleSheet } from 'react-native';

import type { Colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type ButtonVariant = 'brand' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

/** Minimum touch target recommended by Apple (44pt) and Google (48dp). */
export const MIN_TOUCH_TARGET = 44;

const HEIGHT: Record<ButtonSize, number> = { md: 48, sm: 36 };

export type VariantColors = {
  background: string;
  hover: string;
  pressed: string;
  label: string;
  disabledBackground: string;
  disabledLabel: string;
};

// Every variant is described in one place. A new variant without a case here is a type error,
// because the function must return VariantColors on every path.
export function getVariantColors(colors: Colors, variant: ButtonVariant): VariantColors {
  switch (variant) {
    case 'brand':
      return {
        background: colors.brand,
        hover: colors.brandHover,
        pressed: colors.brandActive,
        label: colors.onBrand,
        disabledBackground: colors.brandDisabled,
        disabledLabel: colors.textDisabled,
      };
    case 'secondary':
      return {
        background: colors.secondaryBg,
        hover: colors.secondaryBgHover,
        pressed: colors.secondaryBgHover,
        label: colors.secondaryFg,
        disabledBackground: colors.secondaryBg,
        disabledLabel: colors.textDisabled,
      };
    case 'ghost':
      return {
        background: 'transparent',
        hover: colors.secondaryBg,
        pressed: colors.secondaryBgHover,
        label: colors.textPrimary,
        disabledBackground: 'transparent',
        disabledLabel: colors.textDisabled,
      };
  }
}

/** Extra invisible touch area so a small button still meets MIN_TOUCH_TARGET. */
export function getHitSlop(size: ButtonSize): number {
  return Math.max(0, (MIN_TOUCH_TARGET - HEIGHT[size]) / 2);
}

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    cursor: 'pointer',
  },
  md: { minHeight: HEIGHT.md, paddingHorizontal: spacing.xl },
  sm: { minHeight: HEIGHT.sm, paddingHorizontal: spacing.lg },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { cursor: 'auto' },
  focusRing: { outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2 },
  label: { fontWeight: '600', userSelect: 'none' },
  hidden: { opacity: 0 },
  spinner: { position: 'absolute' },
});
