import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WithdrawForm } from './withdraw-form';

const ADDRESS = '0x1111111111111111111111111111111111111111';

function renderForm() {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  render(<WithdrawForm onSubmit={onSubmit} />);
  return {
    onSubmit,
    amount: screen.getByRole('textbox', { name: 'Amount' }),
    address: screen.getByRole('textbox', { name: 'Wallet address' }),
    note: screen.getByRole('textbox', { name: 'Note' }),
  };
}

describe('WithdrawForm (web)', () => {
  it('marks a field invalid after the user tabs away from it', async () => {
    const { address } = renderForm();
    await userEvent.type(address, '0x12');
    expect(address).toHaveAttribute('aria-invalid', 'false');
    await userEvent.tab();
    await waitFor(() => expect(address).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByRole('alert')).toHaveTextContent(/Enter an EVM address/);
  });

  it('moves to the next field on Enter and submits from the last one', async () => {
    const { amount, address, note, onSubmit } = renderForm();
    await userEvent.type(amount, '2{Enter}');
    expect(address).toHaveFocus();
    await userEvent.type(address, `${ADDRESS}{Enter}`);
    expect(note).toHaveFocus();
    await userEvent.type(note, 'rent{Enter}');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ amount: '2', address: ADDRESS, note: 'rent' }));
  });

  it('focuses the first invalid field when submitting', async () => {
    const { amount } = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    await waitFor(() => expect(amount).toHaveFocus());
    expect(amount).toHaveAttribute('aria-invalid', 'true');
  });
});
