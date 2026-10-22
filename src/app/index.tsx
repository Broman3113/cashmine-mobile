import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { requestWithdraw, WithdrawForm } from '@/features/withdraw';
import { spacing } from '@/theme/spacing';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Field } from '@/ui/field';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

// Temporary screen to check the theme tokens and UI primitives in light and dark mode.
export default function Index() {
  const [pressCount, setPressCount] = useState(0);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'CashMine' }} />

      <Text variant="display">Stop wasting your trading edge</Text>
      <Text tone="secondary">Theme preview</Text>

      <Card>
        <Text variant="label" tone="secondary">
          Earned payback
        </Text>
        <Text variant="title" tone="accent" numeric>
          123.45 USDT
        </Text>
        <Text tone="positive" numeric>
          +4.20 today
        </Text>
        <Button title={`Claim payback (${pressCount})`} isFullWidth onPress={() => setPressCount((n) => n + 1)} />
      </Card>

      <View style={styles.buttonRow}>
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
        <Button title="Small" size="sm" onPress={() => {}} />
        <Button title="Loading" isLoading onPress={() => {}} />
        <Button title="Disabled" disabled onPress={() => {}} />
        <Button title="Disabled" variant="secondary" disabled onPress={() => {}} />
      </View>

      <Card>
        <Text variant="subtitle">Withdraw</Text>
        <WithdrawForm onSubmit={requestWithdraw} />
      </Card>

      <Card>
        <Text variant="subtitle">Field states</Text>
        <Field label="With error" defaultValue="12.345.6" error="Use digits and one dot, up to 8 decimals" />
        <Field label="Disabled" defaultValue="Locked value" disabled />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
