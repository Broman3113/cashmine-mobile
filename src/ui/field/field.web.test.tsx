import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Field, type FieldProps } from './field';
import { styles } from './field.styles';

function renderField(props: Partial<FieldProps> = {}) {
  const onChangeText = jest.fn();
  render(<Field label="Amount" onChangeText={onChangeText} {...props} />);
  return { onChangeText, input: screen.getByRole('textbox', { name: 'Amount' }) };
}

/** Text of the element(s) an input points to with aria-describedby. */
function description(input: HTMLElement) {
  const ids = input.getAttribute('aria-describedby');
  return ids ? document.getElementById(ids)?.textContent : null;
}

describe('Field (web)', () => {
  it('renders an input named by its label and reports typed text', async () => {
    const { input, onChangeText } = renderField();
    await userEvent.type(input, '12.5');
    expect(onChangeText).toHaveBeenLastCalledWith('12.5');
  });

  it('links the hint with aria-describedby', () => {
    const { input } = renderField({ hint: 'Up to 8 decimals' });
    expect(description(input)).toBe('Up to 8 decimals');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('links the error instead of the hint and marks the input invalid', () => {
    const { input } = renderField({ hint: 'Up to 8 decimals', error: 'Enter an amount' });
    expect(description(input)).toBe('Enter an amount');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount');
  });

  it('has no aria-describedby without a hint or error', () => {
    const { input } = renderField();
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('cannot be typed into when disabled', async () => {
    const { input, onChangeText } = renderField({ disabled: true });
    expect(input).toHaveAttribute('readonly');
    await userEvent.type(input, '1');
    expect(onChangeText).not.toHaveBeenCalled();
  });

  it('uses at least a 16px font so iOS Safari does not zoom on focus', () => {
    // jsdom does not resolve react-native-web's class-based font styles, so check the rule itself.
    // Verified at 16px in a real browser.
    expect(styles.input.fontSize).toBeGreaterThanOrEqual(16);
  });

  it('hides the browser outline (the box border is the focus indicator)', async () => {
    const { input } = renderField();
    await userEvent.click(input);
    expect(input).toHaveFocus();
    expect(input).toHaveStyle({ outlineStyle: 'solid', outlineWidth: '0px' });
  });
});
