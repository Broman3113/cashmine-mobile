import { fireEvent, render, screen } from '@testing-library/react-native';
import { createRef, type ComponentRef } from 'react';
import { StyleSheet, type TextInput } from 'react-native';

import { setMockColorScheme } from '@/test-utils/mock-theme';
import { colors } from '@/theme/colors';

import { Field, type FieldProps } from './field';

jest.mock('@/theme/use-theme', () => ({ useTheme: () => require('@/test-utils/mock-theme').useMockTheme() }));

async function renderField(props: Partial<FieldProps> = {}) {
  const onChangeText = jest.fn();
  await render(<Field label="Amount" onChangeText={onChangeText} {...props} />);
  const input = screen.getByLabelText('Amount');
  /** The bordered box around the input. */
  const borderColor = () => StyleSheet.flatten(screen.getByLabelText('Amount').parent!.props.style).borderColor;
  return { onChangeText, input, borderColor };
}

beforeEach(() => setMockColorScheme('light'));

describe('Field (native)', () => {
  it('is found by its label and reports typed text', async () => {
    const { input, onChangeText } = await renderField();
    await fireEvent.changeText(input, '12.5');
    expect(onChangeText).toHaveBeenCalledWith('12.5');
  });

  it('shows the hint and gives it to screen readers', async () => {
    const { input } = await renderField({ hint: 'Up to 8 decimals' });
    expect(screen.getByText('Up to 8 decimals')).toBeTruthy();
    expect(input.props.accessibilityHint).toBe('Up to 8 decimals');
  });

  it('replaces the hint with the error and announces it', async () => {
    const { input } = await renderField({ hint: 'Up to 8 decimals', error: 'Enter an amount' });
    expect(screen.queryByText('Up to 8 decimals')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount');
    expect(input.props.accessibilityHint).toBe('Error: Enter an amount');
  });

  it('is not editable when disabled', async () => {
    const { input } = await renderField({ disabled: true });
    expect(input.props.editable).toBe(false);
  });

  it('shows the optional marker and the suffix', async () => {
    await renderField({ isOptional: true, suffix: 'USDT' });
    expect(screen.getByText('Optional')).toBeTruthy();
    expect(screen.getByText('USDT')).toBeTruthy();
  });

  it('forwards the ref to the input so a form can focus it', async () => {
    const ref = createRef<ComponentRef<typeof TextInput>>();
    await renderField({ ref });
    expect(typeof ref.current?.focus).toBe('function');
  });

  describe.each(['light', 'dark'] as const)('border in %s theme', (scheme) => {
    beforeEach(() => setMockColorScheme(scheme));

    it('is invisible at rest, accent on focus, back to invisible on blur', async () => {
      const { input, borderColor } = await renderField();
      expect(borderColor()).toBe('transparent');
      await fireEvent(input, 'focus');
      expect(borderColor()).toBe(colors[scheme].borderAccent);
      await fireEvent(input, 'blur');
      expect(borderColor()).toBe('transparent');
    });

    it('stays red while an invalid field is being edited', async () => {
      const { input, borderColor } = await renderField({ error: 'Enter an amount' });
      expect(borderColor()).toBe(colors[scheme].borderError);
      await fireEvent(input, 'focus');
      expect(borderColor()).toBe(colors[scheme].borderError);
    });
  });

  it('still calls the onFocus / onBlur passed in', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { input } = await renderField({ onFocus, onBlur });
    await fireEvent(input, 'focus');
    await fireEvent(input, 'blur');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
