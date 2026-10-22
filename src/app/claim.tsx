import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { addInFlightClaim, useAdjustedBalances, useRefreshBalances } from '@/features/balances';
import { ClaimFlow } from '@/features/claim';
import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

export default function ClaimScreen() {
  const { asset } = useLocalSearchParams<{ asset?: string }>();
  const balances = useAdjustedBalances();
  const refreshBalances = useRefreshBalances();
  const balance = balances.data?.items.find((item) => item.asset === asset);

  return (
    <Screen>
      <Stack.Screen options={{ title: asset ? `Claim ${asset}` : 'Claim' }} />
      {balances.isPending ? (
        <ActivityIndicator accessibilityLabel="Loading balances" />
      ) : balance ? (
        <ClaimFlow
          balance={balance}
          onAmountRejected={refreshBalances}
          onCreated={(claim) => {
            addInFlightClaim(claim);
            router.replace({ pathname: '/claims/[id]', params: { id: claim.id } });
          }}
        />
      ) : (
        <Text tone="negative" role="alert">
          {balances.isError ? 'Could not load balances. Go back and try again.' : `No ${asset ?? ''} balance to claim.`}
        </Text>
      )}
    </Screen>
  );
}
