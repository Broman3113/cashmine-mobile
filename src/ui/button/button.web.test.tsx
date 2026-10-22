import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setMockColorScheme } from '@/test-utils/mock-theme';
import { colors } from '@/theme/colors';

import { Button, type ButtonProps } from './button';
import { getVariantColors } from './button.styles';

jest.mock('@/theme/use-theme', () => ({ useTheme: () => require('@/test-utils/mock-theme').useMockTheme() }));

function renderButton(props: Partial<ButtonProps> = {}) {
  const onPress = jest.fn();
  render(<Button title="Pay" onPress={onPress} {...props} />);
  return { onPress, button: screen.getByRole('button', { name: 'Pay' }) };
}

/** jsdom reports colors as rgb(); convert the theme's hex values the same way. */
function rgb(hex: string) {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

beforeEach(() => {
  setMockColorScheme('light');
});

describe('Button (web)', () => {
  describe('DOM and accessibility', () => {
    it('renders a button with its title as the accessible name', () => {
      const { button } = renderButton();
      expect(button).toHaveAttribute('aria-label', 'Pay');
      expect(button).toHaveAttribute('aria-busy', 'false');
      expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('marks a disabled button and removes it from the tab order', () => {
      const { button } = renderButton({ disabled: true });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('tabindex', '-1');
    });

    it('marks a loading button as busy and disabled', () => {
      const { button } = renderButton({ isLoading: true });
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('clicking', () => {
    it('calls onPress on click', async () => {
      const { onPress, button } = renderButton();
      await userEvent.click(button);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPress on Enter when focused with the keyboard', async () => {
      const { onPress } = renderButton();
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it.each([{ disabled: true }, { isLoading: true }])('ignores clicks when %o', async (props) => {
      const { onPress, button } = renderButton(props);
      // The browser itself blocks the pointer...
      expect(button).toHaveStyle({ pointerEvents: 'none' });
      // ...and even a forced click does not reach onPress.
      await userEvent.setup({ pointerEventsCheck: 0 }).click(button);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('focus ring', () => {
    it('shows the ring when focused with the keyboard', async () => {
      const { button } = renderButton();
      await userEvent.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveStyle({ outlineStyle: 'solid', outlineColor: rgb(colors.light.borderAccent) });
    });

    it('does not show the ring when focused by a mouse click', async () => {
      const { button } = renderButton();
      await userEvent.click(button);
      expect(button).toHaveFocus();
      expect(button).not.toHaveStyle({ outlineStyle: 'solid' });
    });

    it('hides the ring on blur', async () => {
      const { button } = renderButton();
      await userEvent.tab();
      await userEvent.tab(); // focus leaves the only button
      expect(button).not.toHaveFocus();
      expect(button).not.toHaveStyle({ outlineStyle: 'solid' });
    });
  });

  describe.each(['light', 'dark'] as const)('colors in %s theme', (scheme) => {
    beforeEach(() => {
      setMockColorScheme(scheme);
    });

    describe.each(['brand', 'secondary', 'ghost'] as const)('%s variant', (variant) => {
      const palette = getVariantColors(colors[scheme], variant);
      const background = (hex: string) => (hex === 'transparent' ? 'rgba(0, 0, 0, 0)' : rgb(hex));

      it('uses the default background', () => {
        const { button } = renderButton({ variant });
        expect(button).toHaveStyle({ backgroundColor: background(palette.background) });
      });

      it('uses the hover background on mouse hover', () => {
        const { button } = renderButton({ variant, testOnly_hovered: true } as Partial<ButtonProps>);
        expect(button).toHaveStyle({ backgroundColor: background(palette.hover) });
      });

      it('uses the pressed background while pressed', () => {
        const { button } = renderButton({ variant, testOnly_pressed: true });
        expect(button).toHaveStyle({ backgroundColor: background(palette.pressed) });
      });

      it('uses the disabled background when disabled', () => {
        const { button } = renderButton({ variant, disabled: true });
        expect(button).toHaveStyle({ backgroundColor: background(palette.disabledBackground) });
      });
    });
  });
});
