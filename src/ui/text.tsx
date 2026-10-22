import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import type { Colors } from '@/theme/colors';
import { typography, type TypographyVariant } from '@/theme/typography';
import { useTheme } from '@/theme/use-theme';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'positive' | 'negative' | 'disabled' | 'onBrand';

const toneColor: Record<Tone, keyof Colors> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  accent: 'textAccent',
  positive: 'textPositive',
  negative: 'textNegative',
  disabled: 'textDisabled',
  onBrand: 'onBrand',
};

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: Tone;
  /** Equal-width digits, so amounts do not shift when they change. */
  numeric?: boolean;
  align?: 'left' | 'center' | 'right';
};

export function Text({ variant = 'body', tone = 'primary', numeric = false, align, style, ...rest }: TextProps) {
  const { colors } = useTheme();

  return (
    <RNText
      style={[
        typography[variant],
        { color: colors[toneColor[tone]], textAlign: align },
        numeric && styles.numeric,
        style, // caller overrides go last
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  numeric: { fontVariant: ['tabular-nums'] },
});
