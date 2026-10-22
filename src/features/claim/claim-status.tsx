import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';

import { useClaim, type Claim } from './api';
import { SummaryRow } from './summary-row';

type ClaimStatusProps = {
  id: string;
  /** Called once when the claim completes or fails. */
  onSettled: (claim: Claim) => void;
};

export function ClaimStatus({ id, onSettled }: ClaimStatusProps) {
  const { colors } = useTheme();
  const { data: claim, error, isFetching, refetch } = useClaim(id);
  const settledStatus = claim && claim.status !== 'pending' ? claim.status : undefined;

  // Reacts to the settlement (an event from the server), not to local state.
  useEffect(() => {
    if (settledStatus && claim) onSettled(claim);
    // Only the transition matters; `claim` and `onSettled` change identity on every poll and render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledStatus]);

  if (!claim) {
    return error ? (
      <Card>
        <Text tone="negative" role="alert">
          Could not load the claim. {getErrorMessage(error)}
        </Text>
        <Button title="Try again" isFullWidth isLoading={isFetching} onPress={() => void refetch()} />
      </Card>
    ) : (
      <ActivityIndicator color={colors.brand} accessibilityLabel="Loading claim" />
    );
  }

  return (
    <View style={styles.status}>
      <Card>
        <SummaryRow label="Amount" value={`${claim.amount} ${claim.asset}`} />
        <SummaryRow label="Fee" value={`${claim.fee} ${claim.asset}`} />
        <SummaryRow label="You receive" value={`${claim.receiveAmount} ${claim.asset}`} isEmphasized />
      </Card>

      {claim.status === 'pending' ? (
        <View style={styles.pending} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.brand} />
          <Text tone="secondary">Processing. This usually takes about 20 seconds.</Text>
        </View>
      ) : null}

      {claim.status === 'completed' ? (
        <Text variant="subtitle" tone="positive" role="status">
          Claim completed
        </Text>
      ) : null}

      {claim.status === 'failed' ? (
        <Text tone="negative" role="alert">
          Claim failed{claim.failureReason ? `: ${claim.failureReason}` : ''}. {claim.amount} {claim.asset} is back in
          your available balance.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  status: { gap: spacing.lg },
  pending: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
