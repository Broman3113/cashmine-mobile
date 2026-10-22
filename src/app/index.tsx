import { router, Stack } from 'expo-router';

import { clearToken } from '@/api';
import { BalancesPanel } from '@/features/balances';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';

export default function Home() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'CashMine' }} />
      <BalancesPanel onClaim={(asset) => router.push({ pathname: '/claim', params: { asset } })} />
      <Button title="Change token" variant="ghost" onPress={clearToken} />
    </Screen>
  );
}
