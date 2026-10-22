import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { WithdrawError } from './withdraw-api';
import { WithdrawForm } from './withdraw-form';
import type { WithdrawRequest } from './withdraw.schema';

const ADDRESS = '0x1111111111111111111111111111111111111111';

async function renderForm(onSubmit = jest.fn<Promise<void>, [WithdrawRequest]>().mockResolvedValue()) {
  await render(<WithdrawForm onSubmit={onSubmit} />);
  return {
    onSubmit,
    amount: () => screen.getByLabelText('Amount'),
    address: () => screen.getByLabelText('Wallet address'),
    note: () => screen.getByLabelText('Note'),
    submit: () => fireEvent.press(screen.getByRole('button', { name: 'Withdraw' })),
  };
}

async function fillValid(form: Awaited<ReturnType<typeof renderForm>>) {
  await fireEvent.changeText(form.amount(), '1,5');
  await fireEvent.changeText(form.address(), ADDRESS);
}

describe('WithdrawForm (native)', () => {
  describe('validation timing (mode: onTouched)', () => {
    it('shows no error while a field is typed into for the first time', async () => {
      const form = await renderForm();
      await fireEvent(form.address(), 'focus');
      await fireEvent.changeText(form.address(), '0x12');
      expect(screen.queryByText(/Enter an EVM address/)).toBeNull();
    });

    it('shows the error when the field loses focus', async () => {
      const form = await renderForm();
      await fireEvent.changeText(form.address(), '0x12');
      await fireEvent(form.address(), 'blur');
      expect(await screen.findByText(/Enter an EVM address/)).toBeTruthy();
    });

    it('removes the error as soon as the value becomes valid', async () => {
      const form = await renderForm();
      await fireEvent.changeText(form.address(), '0x12');
      await fireEvent(form.address(), 'blur');
      await screen.findByText(/Enter an EVM address/);
      await fireEvent.changeText(form.address(), ADDRESS);
      await waitFor(() => expect(screen.queryByText(/Enter an EVM address/)).toBeNull());
    });
  });

  describe('submitting', () => {
    it('shows every required-field error and does not submit an empty form', async () => {
      const form = await renderForm();
      await form.submit();
      expect(await screen.findByText('Enter an amount')).toBeTruthy();
      expect(screen.getByText('Enter a wallet address')).toBeTruthy();
      expect(screen.queryByText('Keep the note under 64 characters')).toBeNull();
      expect(form.onSubmit).not.toHaveBeenCalled();
    });

    it('submits normalized values, confirms and clears the form', async () => {
      const form = await renderForm();
      await fillValid(form);
      await form.submit();
      await waitFor(() => expect(form.onSubmit).toHaveBeenCalledWith({ amount: '1.5', address: ADDRESS, note: '' }));
      expect(await screen.findByText('Withdrawal requested')).toBeTruthy();
      expect(form.amount().props.value).toBe('');
    });

    it('submits only once while the request is in flight', async () => {
      let finish: () => void = () => {};
      const onSubmit = jest.fn((_request: WithdrawRequest) => new Promise<void>((resolve) => (finish = resolve)));
      const form = await renderForm(onSubmit);
      await fillValid(form);
      await form.submit();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      await form.submit(); // button is loading now
      expect(onSubmit).toHaveBeenCalledTimes(1);
      finish();
      expect(await screen.findByText('Withdrawal requested')).toBeTruthy();
    });

    it('shows a server error next to the field it belongs to', async () => {
      const onSubmit = jest
        .fn()
        .mockRejectedValue(new WithdrawError('This address cannot receive withdrawals', 'address'));
      const form = await renderForm(onSubmit);
      await fillValid(form);
      await form.submit();
      expect(await screen.findByText('This address cannot receive withdrawals')).toBeTruthy();
      expect(form.address().props.value).toBe(ADDRESS); // input kept for fixing
      expect(screen.queryByText('Withdrawal requested')).toBeNull();
    });

    it('shows other failures above the button', async () => {
      const form = await renderForm(jest.fn().mockRejectedValue(new Error('Service unavailable')));
      await fillValid(form);
      await form.submit();
      expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    });
  });
});
