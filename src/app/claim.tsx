import { Stack, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/ui/screen';
import { Text } from '@/ui/text';

// Placeholder until the claim feature lands.
export default function ClaimScreen() {
  const { asset } = useLocalSearchParams<{ asset?: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: asset ? `Claim ${asset}` : 'Claim' }} />
      <Text tone="secondary">Claiming is coming next.</Text>
    </Screen>
  );
}
