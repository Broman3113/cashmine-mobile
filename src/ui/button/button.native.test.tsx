import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { setMockColorScheme } from '@/test-utils/mock-theme';
import { colors } from '@/theme/colors';

import { Button, type ButtonProps } from './button';
import { getVariantColors } from './button.styles';

jest.mock('@/theme/use-theme', () => ({ useTheme: () => require('@/test-utils/mock-theme').useMockTheme() }));

async function renderButton(props: Partial<ButtonProps> = {}) {
  const onPress = jest.fn();
  await render(<Button title="Pay" onPress={onPress} {...props} />);
  const button = screen.getByRole('button', { name: 'Pay' });
  return { onPress, button, style: StyleSheet.flatten(button.props.style) };
}

beforeEach(() => {
  setMockColorScheme('light');
});

describe('Button (native)', () => {
  describe('pressing', () => {
    it('calls onPress', async () => {
      const { onPress, button } = await renderButton();
      await fireEvent.press(button);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('ignores presses and reports disabled when disabled', async () => {
      const { onPress, button } = await renderButton({ disabled: true });
      await fireEvent.press(button);
      expect(onPress).not.toHaveBeenCalled();
      expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: false });
    });

    it('ignores presses, reports busy and shows a spinner while loading', async () => {
      const { onPress, button } = await renderButton({ isLoading: true });
      await fireEvent.press(button);
      expect(onPress).not.toHaveBeenCalled();
      expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
      expect(screen.getByTestId('button-spinner')).toBeTruthy();
      // The label stays rendered (transparent) so the button keeps its width.
      expect(screen.getByText('Pay')).toBeTruthy();
    });
  });

  describe.each(['light', 'dark'] as const)('colors in %s theme', (scheme) => {
    beforeEach(() => {
      setMockColorScheme(scheme);
    });

    describe.each(['brand', 'secondary', 'ghost'] as const)('%s variant', (variant) => {
      const palette = getVariantColors(colors[scheme], variant);

      it('uses the default background', async () => {
        const { style } = await renderButton({ variant });
        expect(style.backgroundColor).toBe(palette.background);
      });

      it('uses the pressed background while pressed', async () => {
        const { style } = await renderButton({ variant, testOnly_pressed: true });
        expect(style.backgroundColor).toBe(palette.pressed);
      });

      it('uses disabled colors when disabled', async () => {
        const { style } = await renderButton({ variant, disabled: true });
        expect(style.backgroundColor).toBe(palette.disabledBackground);
        expect(StyleSheet.flatten(screen.getByText('Pay').props.style).color).toBe(palette.disabledLabel);
      });

      it('keeps the normal background while loading', async () => {
        const { style } = await renderButton({ variant, isLoading: true });
        expect(style.backgroundColor).toBe(palette.background);
      });
    });
  });

  describe('touch target', () => {
    it('extends the small button tap area to 44px', async () => {
      const { button } = await renderButton({ size: 'sm' }); // 36px high
      expect(button.props.hitSlop).toBe(4);
    });

    it('does not extend the medium button', async () => {
      const { button } = await renderButton({ size: 'md' }); // 48px high
      expect(button.props.hitSlop).toBe(0);
    });
  });

  it('never shows a focus ring on native', async () => {
    const { button } = await renderButton();
    await fireEvent(button, 'focus');
    expect(StyleSheet.flatten(screen.getByRole('button').props.style).outlineStyle).toBeUndefined();
  });

  it('forwards onFocus and onBlur', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { button } = await renderButton({ onFocus, onBlur });
    await fireEvent(button, 'focus');
    await fireEvent(button, 'blur');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
