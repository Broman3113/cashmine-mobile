import { withdrawSchema, type WithdrawFormValues } from './withdraw.schema';

const VALID: WithdrawFormValues = {
  amount: '12.5',
  address: '0x1111111111111111111111111111111111111111',
  note: '',
};

/** First error message for a field, the one the form displays. */
function firstError(values: Partial<WithdrawFormValues>, field: keyof WithdrawFormValues) {
  const result = withdrawSchema.safeParse({ ...VALID, ...values });
  return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('withdrawSchema', () => {
  it('accepts valid values and trims them', () => {
    const result = withdrawSchema.parse({ ...VALID, amount: ' 12.5 ', note: ' rent ' });
    expect(result).toEqual({ ...VALID, amount: '12.5', note: 'rent' });
  });

  describe('amount', () => {
    it.each(['1', '0.5', '1000000', '0.00000001', '12.12345678'])('accepts %s', (amount) => {
      expect(firstError({ amount }, 'amount')).toBeUndefined();
    });

    it('turns a comma into a dot', () => {
      expect(withdrawSchema.parse({ ...VALID, amount: '1,5' }).amount).toBe('1.5');
    });

    it.each([
      ['', 'Enter an amount'],
      ['   ', 'Enter an amount'],
      ['abc', 'Use digits and one dot, up to 8 decimals, e.g. 12.5'],
      ['1.', 'Use digits and one dot, up to 8 decimals, e.g. 12.5'],
      ['.5', 'Use digits and one dot, up to 8 decimals, e.g. 12.5'],
      ['1.2.3', 'Use digits and one dot, up to 8 decimals, e.g. 12.5'],
      ['-1', 'Use digits and one dot, up to 8 decimals, e.g. 12.5'],
      ['1e5', 'Use digits and one dot, up to 8 decimals, e.g. 12.5'],
      ['0.123456789', 'Use digits and one dot, up to 8 decimals, e.g. 12.5'],
      ['0', 'Amount must be greater than 0'],
      ['0.000', 'Amount must be greater than 0'],
    ])('rejects "%s" with "%s"', (amount, message) => {
      expect(firstError({ amount }, 'amount')).toBe(message);
    });
  });

  describe('address', () => {
    it('accepts mixed-case hex', () => {
      expect(firstError({ address: '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01' }, 'address')).toBeUndefined();
    });

    it.each([
      ['', 'Enter a wallet address'],
      ['0x123', 'Enter an EVM address: 0x followed by 40 hex characters'],
      ['1111111111111111111111111111111111111111', 'Enter an EVM address: 0x followed by 40 hex characters'],
      ['0xZZ11111111111111111111111111111111111111', 'Enter an EVM address: 0x followed by 40 hex characters'],
    ])('rejects "%s" with "%s"', (address, message) => {
      expect(firstError({ address }, 'address')).toBe(message);
    });
  });

  describe('note', () => {
    it('is optional', () => {
      expect(firstError({ note: '' }, 'note')).toBeUndefined();
    });

    it('rejects more than 64 characters', () => {
      expect(firstError({ note: 'x'.repeat(65) }, 'note')).toBe('Keep the note under 64 characters');
    });
  });
});
