import { StyleSheet, View } from 'react-native';

import { receiveAmount } from '@/lib/money';
import { spacing } from '@/theme/spacing';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Text } from '@/ui/text';

import { SummaryRow } from './summary-row';

type ClaimReviewProps = {
  asset: string;
  amount: string;
  fee: string;
  destinationLabel: string;
  isSubmitting: boolean;
  /** The claim may or may not exist; only the same request can tell. */
  isOutcomeUnknown: boolean;
  error?: string;
  onConfirm: () => void;
  onCheckAgain: () => void;
  onEdit: () => void;
};

export function ClaimReview({
  asset,
  amount,
  fee,
  destinationLabel,
  isSubmitting,
  isOutcomeUnknown,
  error,
  onConfirm,
  onCheckAgain,
  onEdit,
}: ClaimReviewProps) {
  return (
    <View style={styles.review}>
      <Card>
        <Text variant="subtitle">Review your claim</Text>
        <SummaryRow label="Amount" value={`${amount} ${asset}`} />
        <SummaryRow label="Fee" value={`${fee} ${asset}`} />
        <SummaryRow label="You receive" value={`${receiveAmount(amount, fee) ?? '0'} ${asset}`} isEmphasized />
        <SummaryRow label="To" value={destinationLabel} />
      </Card>

      {isOutcomeUnknown ? (
        <>
          <Text tone="negative" role="alert">
            We could not confirm your claim. It may have gone through. Check again before doing anything else: it will
            not create a second claim.
          </Text>
          <Button title="Check again" isFullWidth isLoading={isSubmitting} onPress={onCheckAgain} />
        </>
      ) : (
        <>
          {error ? (
            <Text tone="negative" role="alert">
              {error}
            </Text>
          ) : null}
          <Button title={`Confirm claim`} isFullWidth isLoading={isSubmitting} onPress={onConfirm} />
          <Button title="Edit" variant="ghost" isFullWidth disabled={isSubmitting} onPress={onEdit} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  review: { gap: spacing.lg },
});
