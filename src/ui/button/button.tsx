import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/use-theme';
import { Text } from '@/ui/text';

import { getHitSlop, getVariantColors, styles, type ButtonSize, type ButtonVariant } from './button.styles';
import { useFocusVisible } from './use-focus-visible';

// react-native-web also reports `hovered` and `focused`; React Native's types only declare `pressed`.
type InteractionState = PressableStateCallbackType & { hovered?: boolean };

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, blocks presses and keeps the button width unchanged. */
  isLoading?: boolean;
  isFullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'brand',
  size = 'md',
  isLoading = false,
  isFullWidth = false,
  disabled,
  style,
  onFocus,
  onBlur,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const focus = useFocusVisible();
  const isDisabled = Boolean(disabled) || isLoading;
  const palette = getVariantColors(colors, variant);
  const labelColor = isDisabled && !isLoading ? palette.disabledLabel : palette.label;

  const getBackground = ({ pressed, hovered }: InteractionState) => {
    if (isLoading) return palette.background; // busy, not unavailable: keep the normal look
    if (isDisabled) return palette.disabledBackground;
    if (pressed) return palette.pressed;
    if (hovered) return palette.hover;
    return palette.background;
  };

  return (
    <Pressable
      role="button"
      aria-label={title}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      disabled={isDisabled}
      hitSlop={getHitSlop(size)}
      onFocus={(event) => {
        focus.onFocus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.onBlur();
        onBlur?.(event);
      }}
      style={(state) => [
        styles.base,
        styles[size],
        isFullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        { backgroundColor: getBackground(state) },
        focus.isFocusVisible && [styles.focusRing, { outlineColor: colors.borderAccent }],
        style,
      ]}
      {...rest}
    >
      <Text variant="label" numberOfLines={1} style={[styles.label, { color: labelColor }, isLoading && styles.hidden]}>
        {title}
      </Text>
      {isLoading ? <ActivityIndicator testID="button-spinner" color={palette.label} style={styles.spinner} /> : null}
    </Pressable>
  );
}
