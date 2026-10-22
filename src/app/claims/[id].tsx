import { router, Stack, useLocalSearchParams } from 'expo-router';

import { removeInFlightClaim, useRefreshBalances } from '@/features/balances';
import { ClaimStatus } from '@/features/claim';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';

export default function ClaimStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const refreshBalances = useRefreshBalances();

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Claim' }} />
      <ClaimStatus
        id={id}
        onSettled={(claim) => {
          // A failed claim's amount is available again right now; don't wait for the next snapshot.
          if (claim.status === 'failed') removeInFlightClaim(claim.id);
          refreshBalances();
        }}
      />
      <Button title="Back to balances" variant="secondary" isFullWidth onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}
