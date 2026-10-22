import { useId, useState, type ComponentRef, type Ref } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/use-theme';
import { Text } from '@/ui/text';

import { getBorderColor, styles } from './field.styles';
import { getInputA11yProps } from './input-a11y';

export type FieldProps = Omit<TextInputProps, 'style' | 'editable'> & {
  label: string;
  /** Helper text under the input. Replaced by `error` while there is one. */
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** Marks the field as not required. Required is the default in forms that move money. */
  isOptional?: boolean;
  /** Unit shown inside the input on the right, e.g. "USDT". */
  suffix?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
  /** Style of the outer container (spacing in a layout), not of the input. */
  style?: StyleProp<ViewStyle>;
};

export function Field({
  label,
  hint,
  error,
  disabled = false,
  isOptional = false,
  suffix,
  ref,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: FieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const messageId = useId();

  const isInvalid = Boolean(error);
  const message = error ?? hint;
  const borderColor = getBorderColor(colors, { isFocused, isInvalid });

  return (
    <View style={[styles.container, disabled && styles.disabled, style]}>
      <View style={styles.labelRow}>
        <Text variant="label" tone="secondary">
          {label}
        </Text>
        {isOptional ? (
          <Text variant="caption" tone="tertiary">
            Optional
          </Text>
        ) : null}
      </View>

      <View style={[styles.box, { backgroundColor: colors.surfaceField, borderColor }]}>
        <TextInput
          ref={ref}
          aria-label={label}
          aria-disabled={disabled}
          editable={!disabled}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.brand}
          cursorColor={colors.brand}
          style={[styles.input, { color: colors.textPrimary }]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...getInputA11yProps({ messageId, message, isInvalid })}
          {...inputProps}
        />
        {suffix ? <Text tone="secondary">{suffix}</Text> : null}
      </View>

      {message ? (
        <Text
          nativeID={messageId}
          variant="caption"
          tone={isInvalid ? 'negative' : 'tertiary'}
          role={isInvalid ? 'alert' : undefined}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
