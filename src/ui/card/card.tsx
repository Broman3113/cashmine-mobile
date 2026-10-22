import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/use-theme';

export type CardProps = {
  children: ReactNode;
  /** Layout tweaks from the parent (margins, flex). Colors and padding come from the theme. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Surface that groups related content. Not pressable: a tappable card is a separate component when needed. */
export function Card({ children, style, testID }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.borderDefault }, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.content,
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
});
