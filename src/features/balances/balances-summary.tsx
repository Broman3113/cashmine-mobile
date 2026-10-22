import { StyleSheet, View } from 'react-native';

import { availableUsd, formatUsd, totalUsd } from '@/lib/money';
import { spacing } from '@/theme/spacing';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';

import type { Balances } from './api';
import { formatUpdatedAgo, getSnapshotAgeSeconds, STALE_AFTER_SECONDS } from './freshness';
import { useNow } from './use-now';

type BalancesSummaryProps = {
  balances: Balances;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function BalancesSummary({ balances, isRefreshing, onRefresh }: BalancesSummaryProps) {
  const now = useNow();
  const ageSeconds = getSnapshotAgeSeconds(balances.asOf, now);
  const isStale = ageSeconds >= STALE_AFTER_SECONDS;

  return (
    <Card>
      <Text variant="label" tone="secondary">
        Available to claim
      </Text>
      <Text variant="display" numeric>
        {formatUsd(availableUsd(balances.items))}
      </Text>
      <Text tone="secondary" numeric>
        Total incl. pending & claiming: {formatUsd(totalUsd(balances.items))}
      </Text>

      <View style={styles.footer}>
        <Text variant="caption" tone={isStale ? 'negative' : 'tertiary'} style={styles.updated}>
          {formatUpdatedAgo(ageSeconds)}
          {isStale ? '. Balances may be out of date.' : ''}
        </Text>
        <Button title="Refresh" variant="ghost" size="sm" isLoading={isRefreshing} onPress={onRefresh} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  updated: { flexShrink: 1 },
});
