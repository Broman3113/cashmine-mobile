import { Stack } from 'expo-router';

import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

// Placeholder until the balances feature lands.
export default function Home() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'CashMine' }} />
      <Text variant="title">Payback</Text>
    </Screen>
  );
}
