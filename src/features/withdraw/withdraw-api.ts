import type { WithdrawFormValues, WithdrawRequest } from './withdraw.schema';

/** A rejection the form can show: next to a field, or above the submit button when `field` is absent. */
export class WithdrawError extends Error {
  constructor(
    message: string,
    readonly field?: keyof WithdrawFormValues,
  ) {
    super(message);
    this.name = 'WithdrawError';
  }
}

/**
 * Placeholder until the real API exists: waits like a network call and rejects
 * addresses ending in 0000, so field-level server errors can be tried in the UI.
 */
export async function requestWithdraw(request: WithdrawRequest): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (request.address.toLowerCase().endsWith('0000')) {
    throw new WithdrawError('This address cannot receive withdrawals', 'address');
  }
}
