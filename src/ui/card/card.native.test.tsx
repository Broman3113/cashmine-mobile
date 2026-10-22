import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { setMockColorScheme } from '@/test-utils/mock-theme';
import { colors } from '@/theme/colors';
import { Text } from '@/ui/text';

import { Card } from './card';

jest.mock('@/theme/use-theme', () => ({ useTheme: () => require('@/test-utils/mock-theme').useMockTheme() }));

async function renderCard(style?: object) {
  await render(
    <Card testID="card" style={style}>
      <Text>Earned payback</Text>
    </Card>,
  );
  return StyleSheet.flatten(screen.getByTestId('card').props.style);
}

describe('Card (native)', () => {
  it('renders its children', async () => {
    await renderCard();
    expect(screen.getByText('Earned payback')).toBeTruthy();
  });

  it.each(['light', 'dark'] as const)('uses the %s theme surface and border', async (scheme) => {
    setMockColorScheme(scheme);
    const style = await renderCard();
    expect(style.backgroundColor).toBe(colors[scheme].surfaceCard);
    expect(style.borderColor).toBe(colors[scheme].borderDefault);
  });

  it('accepts layout tweaks from the parent', async () => {
    const style = await renderCard({ marginTop: 8 });
    expect(style.marginTop).toBe(8);
  });
});
