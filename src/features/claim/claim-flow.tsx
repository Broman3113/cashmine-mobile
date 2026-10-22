import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiError, getErrorMessage } from '@/api';
import {
  finalizeAmountInput,
  formatAmount,
  maxClaimAmount,
  normalizeAmountInput,
  receiveAmount,
  validateClaimAmount,
} from '@/lib/money';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useTheme } from '@/theme/use-theme';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Field } from '@/ui/field';
import { Text } from '@/ui/text';

import { getAmountMessage } from './amount-message';
import { useClaimOptions, useSubmitClaim, type Claim } from './api';
import { ClaimReview } from './claim-review';
import { createClaimAttempt, isUnknownOutcome, type ClaimAttempt } from './submit';
import { SummaryRow } from './summary-row';

export type ClaimableBalance = {
  asset: string;
  decimals: number;
  /** Already reduced by our in-flight claims the snapshot does not show yet. */
  available: string;
};

type ClaimFlowProps = {
  balance: ClaimableBalance;
  onCreated: (claim: Claim) => void;
  /** The server rejected the amount: the snapshot is probably behind the live balance. */
  onAmountRejected: () => void;
};

export function ClaimFlow({ balance, onCreated, onAmountRejected }: ClaimFlowProps) {
  const { colors } = useTheme();
  const { asset, decimals, available } = balance;
  const options = useClaimOptions(asset);
  const submitClaim = useSubmitClaim();

  const [input, setInput] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [isReviewing, setIsReviewing] = useState(false);
  // Exists from Confirm until the claim is known; every send of this intent reuses it.
  const [attempt, setAttempt] = useState<ClaimAttempt>();

  if (options.isPending) {
    return <ActivityIndicator color={colors.brand} accessibilityLabel="Loading claim options" />;
  }
  if (!options.data) {
    return (
      <Card>
        <Text tone="negative" role="alert">
          Could not load claim options. {getErrorMessage(options.error)}
        </Text>
        <Button title="Try again" isFullWidth isLoading={options.isFetching} onPress={() => void options.refetch()} />
      </Card>
    );
  }

  const { minAmount, fee, destinations } = options.data;
  const destination = destinations[0];
  const rules = { decimals, minAmount, available, fee };
  const validation = validateClaimAmount(input, rules);
  const fieldError =
    serverError ??
    (isTouched && !validation.isValid ? getAmountMessage(validation.reason, { ...rules, asset }) : undefined);
  const receive = receiveAmount(normalizeAmountInput(input), fee);
  const isOutcomeUnknown = submitClaim.isError && isUnknownOutcome(submitClaim.error);

  const send = (claimAttempt: ClaimAttempt) => {
    submitClaim.mutate(claimAttempt, {
      onSuccess: onCreated,
      onError: (error) => {
        if (isUnknownOutcome(error)) return; // keep the attempt for "Check again"
        setAttempt(undefined); // a definite answer: a new intent gets a new key
        if (error instanceof ApiError && error.status === 400) {
          setServerError(error.message);
          setIsReviewing(false);
          if (error.field === 'amount') onAmountRejected();
        }
      },
    });
  };

  const handleConfirm = () => {
    if (!validation.isValid || !destination) return;
    const next = createClaimAttempt({ asset, amount: validation.amount, destinationId: destination.id });
    setAttempt(next);
    send(next);
  };

  if (isReviewing && validation.isValid && destination) {
    return (
      <ClaimReview
        asset={asset}
        amount={validation.amount}
        fee={fee}
        destinationLabel={destination.label}
        isSubmitting={submitClaim.isPending}
        isOutcomeUnknown={isOutcomeUnknown}
        error={submitClaim.isError && !isOutcomeUnknown ? submitError(submitClaim.error) : undefined}
        onConfirm={handleConfirm}
        onCheckAgain={() => attempt && send(attempt)}
        onEdit={() => {
          submitClaim.reset();
          setIsReviewing(false);
        }}
      />
    );
  }

  return (
    <View style={styles.form}>
      <Card>
        <SummaryRow label="Available" value={`${formatAmount(available, decimals)} ${asset}`} />
        <SummaryRow label="Minimum" value={`${minAmount} ${asset}`} />
        <SummaryRow label="Fee" value={`${fee} ${asset}`} />
      </Card>

      <View style={styles.amountRow}>
        <Field
          label="Amount"
          suffix={asset}
          value={input}
          error={fieldError}
          placeholder="0.00"
          inputMode="decimal"
          autoComplete="off"
          style={styles.amountField}
          onChangeText={(value) => {
            setInput(normalizeAmountInput(value));
            setServerError(undefined);
          }}
          onBlur={() => {
            setInput(finalizeAmountInput(input));
            setIsTouched(true);
          }}
        />
        <Button
          title="Max"
          variant="secondary"
          style={styles.maxButton}
          onPress={() => {
            setInput(maxClaimAmount({ available, decimals, inFlight: [] }));
            setIsTouched(true);
            setServerError(undefined);
          }}
        />
      </View>

      <Card>
        <SummaryRow label="Fee" value={`${fee} ${asset}`} />
        <SummaryRow label="You receive" value={receive ? `${receive} ${asset}` : '—'} />
      </Card>

      {destination ? (
        <Text tone="secondary">To {destination.label}</Text>
      ) : (
        <Text tone="negative" role="alert">
          No destination is set up for {asset}. Claiming is not possible yet.
        </Text>
      )}

      <Button
        title="Review"
        isFullWidth
        disabled={!destination}
        onPress={() => {
          setIsTouched(true);
          if (validation.isValid) setIsReviewing(true);
        }}
      />
    </View>
  );
}

function submitError(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return 'This claim conflicts with an earlier request. Check your balances before trying again.';
  }
  return getErrorMessage(error);
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  amountField: { flex: 1 },
  // Lines Max up with the input box: skip the Field's label row (label line + gap). Aligning to the bottom
  // would break as soon as an error appears under the input. A md Button is as tall as the input box (48).
  maxButton: { marginTop: typography.label.lineHeight + spacing.xs },
});
