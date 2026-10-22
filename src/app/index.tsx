import { Stack } from 'expo-router';

import { clearToken } from '@/api';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

// Placeholder until the balances feature lands.
export default function Home() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'CashMine' }} />
      <Text variant="title">Payback</Text>
      <Button title="Change token" variant="secondary" onPress={clearToken} />
    </Screen>
  );
}
