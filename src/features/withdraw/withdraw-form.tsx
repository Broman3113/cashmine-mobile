import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/spacing';
import { Button } from '@/ui/button';
import { FormField } from '@/ui/form-field';
import { Text } from '@/ui/text';

import { WithdrawError } from './withdraw-api';
import { withdrawSchema, type WithdrawFormValues, type WithdrawRequest } from './withdraw.schema';

type WithdrawFormProps = {
  onSubmit: (request: WithdrawRequest) => Promise<void>;
};

const EMPTY: WithdrawFormValues = { amount: '', address: '', note: '' };

export function WithdrawForm({ onSubmit }: WithdrawFormProps) {
  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<WithdrawFormValues, unknown, WithdrawRequest>({
    resolver: zodResolver(withdrawSchema),
    // Validate a field first when it loses focus, then live on every change while it is being fixed.
    // No red errors while the user is still typing for the first time.
    mode: 'onTouched',
    defaultValues: EMPTY,
  });

  const submit = handleSubmit(async (request) => {
    try {
      await onSubmit(request);
      reset(EMPTY, { keepIsSubmitSuccessful: true });
    } catch (error) {
      if (error instanceof WithdrawError && error.field) {
        setError(error.field, { message: error.message }, { shouldFocus: true });
      } else {
        const message = error instanceof Error ? error.message : 'Something went wrong. Try again.';
        setError('root.server', { message });
      }
    }
  });

  return (
    <View style={styles.form}>
      <FormField
        control={control}
        name="amount"
        label="Amount"
        suffix="USDT"
        placeholder="0.00"
        inputMode="decimal"
        autoComplete="off"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('address')}
      />
      <FormField
        control={control}
        name="address"
        label="Wallet address"
        hint="Arbitrum (EVM) address"
        placeholder="0x…"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="next"
        onSubmitEditing={() => setFocus('note')}
      />
      <FormField
        control={control}
        name="note"
        label="Note"
        isOptional
        returnKeyType="send"
        onSubmitEditing={() => void submit()}
      />

      {errors.root?.server ? (
        <Text tone="negative" role="alert">
          {errors.root.server.message}
        </Text>
      ) : null}
      {isSubmitSuccessful && !errors.root ? <Text tone="positive">Withdrawal requested</Text> : null}

      <Button title="Withdraw" isFullWidth isLoading={isSubmitting} onPress={() => void submit()} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
