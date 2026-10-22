import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/spacing';
import { Text } from '@/ui/text';

type SummaryRowProps = { label: string; value: string; isEmphasized?: boolean };

export function SummaryRow({ label, value, isEmphasized = false }: SummaryRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="label" tone="secondary">
        {label}
      </Text>
      <Text variant={isEmphasized ? 'subtitle' : 'body'} numeric align="right" style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  value: { flexShrink: 1 },
});
