import { StyleSheet, View } from 'react-native';

import { formatAmount, formatUsd, maxClaimAmount, usdValue } from '@/lib/money';
import { spacing } from '@/theme/spacing';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';

import type { AssetBalance } from './api';

type AssetCardProps = {
  balance: AssetBalance;
  onClaim: (asset: string) => void;
};

export function AssetCard({ balance, onClaim }: AssetCardProps) {
  const { asset, decimals, available, pending, claiming, usdPrice } = balance;
  const canClaim = maxClaimAmount({ available, decimals, inFlight: [] }) !== '0';

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="subtitle">{asset}</Text>
        <Text tone="secondary" numeric>
          ≈ {formatUsd(usdValue(available, usdPrice))}
        </Text>
      </View>

      <AmountRow label="Available" value={`${formatAmount(available, decimals)} ${asset}`} isEmphasized />
      <AmountRow label="Pending" value={`${formatAmount(pending, decimals)} ${asset}`} />
      <AmountRow label="Claiming" value={`${formatAmount(claiming, decimals)} ${asset}`} />

      <Button
        title={`Claim ${asset}`}
        variant="secondary"
        isFullWidth
        disabled={!canClaim}
        onPress={() => onClaim(asset)}
      />
    </Card>
  );
}

function AmountRow({ label, value, isEmphasized = false }: { label: string; value: string; isEmphasized?: boolean }) {
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md },
  value: { flexShrink: 1 },
});
