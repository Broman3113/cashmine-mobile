import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TokenForm } from './token-form';

function renderForm({ isRejected = false } = {}) {
  const onSubmit = jest.fn();
  render(<TokenForm isRejected={isRejected} onSubmit={onSubmit} />);
  return { onSubmit, input: screen.getByRole('textbox', { name: 'API token' }) };
}

describe('TokenForm (web)', () => {
  it('submits the trimmed token on Enter', async () => {
    const { input, onSubmit } = renderForm();
    await userEvent.type(input, '  abc123  {Enter}');
    expect(onSubmit).toHaveBeenCalledWith('abc123');
  });

  it('asks for a token instead of submitting a blank one', async () => {
    const { input, onSubmit } = renderForm();
    await userEvent.type(input, '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Paste your API token');
  });

  it('explains when the previous token was rejected', () => {
    renderForm({ isRejected: true });
    expect(screen.getByRole('alert')).toHaveTextContent(/rejected or has expired/);
  });

  it('shows no alert on first open', () => {
    renderForm();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
