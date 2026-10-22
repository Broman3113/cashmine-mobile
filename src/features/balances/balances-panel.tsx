import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';

import { useAdjustedBalances } from './use-adjusted-balances';
import { AssetCard } from './asset-card';
import { BalancesSummary } from './balances-summary';

type BalancesPanelProps = {
  onClaim: (asset: string) => void;
};

/** Home content: every state of the balances query (loading, error, empty, data, failed refresh). */
export function BalancesPanel({ onClaim }: BalancesPanelProps) {
  const { colors } = useTheme();
  const { data, error, isPending, isError, isFetching, refetch } = useAdjustedBalances();
  const handleRefresh = () => void refetch();

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand} accessibilityLabel="Loading balances" />
        <Text tone="secondary">Loading balances…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <Card>
        <Text tone="negative" role="alert">
          Could not load balances. {getErrorMessage(error)}
        </Text>
        <Button title="Try again" isFullWidth isLoading={isFetching} onPress={handleRefresh} />
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      <BalancesSummary balances={data} isRefreshing={isFetching} onRefresh={handleRefresh} />

      {/* Data is still shown after a failed background refresh; the age line tells how old it is. */}
      {isError ? (
        <Text tone="negative" role="alert">
          Could not refresh. {getErrorMessage(error)}
        </Text>
      ) : null}

      {data.items.length === 0 ? (
        <Card>
          <Text tone="secondary">No payback balances yet.</Text>
        </Card>
      ) : (
        // A handful of assets: a plain list is fine here; a long list would use FlatList.
        data.items.map((balance) => <AssetCard key={balance.asset} balance={balance} onClaim={onClaim} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  list: { gap: spacing.lg },
});
