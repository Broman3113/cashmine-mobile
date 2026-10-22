import {
  availableUsd,
  finalizeAmountInput,
  formatAmount,
  formatUsd,
  isApiAmount,
  maxClaimAmount,
  normalizeAmountInput,
  receiveAmount,
  totalUsd,
  usdValue,
  validateClaimAmount,
  type ClaimAmountRules,
} from './money';

describe('normalizeAmountInput', () => {
  // Runs on every keystroke and rewrites the visible field, so partial input must survive ("1." while typing "1.5").
  it.each([
    ['', ''],
    ['  12.5  ', '12.5'],
    ['0,5', '0.5'], // keyboards that only offer a comma
    ['.5', '0.5'],
    ['.', '0.'],
    [',', '0.'],
    ['05', '5'],
    ['007', '7'],
    ['00.5', '0.5'],
    ['000', '0'],
    ['0', '0'],
    ['0.', '0.'], // typing in progress
    ['1.', '1.'], // typing in progress
    ['10', '10'], // zeros after the first digit stay
    ['100.00', '100.00'], // trailing zeros stay while typing
  ])('%j → %j', (input, expected) => {
    expect(normalizeAmountInput(input)).toBe(expected);
  });

  it.each([
    [' 12.5 ', '12.5'],
    ['\t0,25\n', '0.25'],
    ['  .5', '0.5'],
  ])('trims a pasted value: %j → %j', (input, expected) => {
    expect(normalizeAmountInput(input)).toBe(expected);
  });

  it.each([['1e-3'], ['1.2.3'], ['abc'], ['-1'], ['1 000'], ['0x10']])(
    'leaves %j as typed, so validation can explain it',
    (input) => {
      expect(normalizeAmountInput(input)).toBe(input);
    },
  );
});

describe('finalizeAmountInput', () => {
  // Runs when the field loses focus: no more typing, so a dangling dot is dropped.
  it.each([
    ['1.', '1'],
    ['0.', '0'],
    ['.', '0'],
    [' 12. ', '12'],
    ['05.', '5'],
    ['1,', '1'],
  ])('%j → %j', (input, expected) => {
    expect(finalizeAmountInput(input)).toBe(expected);
  });

  it.each([
    ['1.5', '1.5'],
    ['100.00', '100.00'],
    ['', ''],
    ['1e-3', '1e-3'],
    ['1.2.', '1.2.'], // not a number with a dangling dot: left for validation
  ])('otherwise works like normalizeAmountInput: %j → %j', (input, expected) => {
    expect(finalizeAmountInput(input)).toBe(expected);
  });
});

describe('isApiAmount', () => {
  it.each(['0', '0.5', '12', '820.413207', '0.00000001', '1.50'])('accepts %j', (value) => {
    expect(isApiAmount(value)).toBe(true);
  });

  it.each(['', '.5', '1.', '05', '1e-3', '1,5', '-1', ' 1', '1.2.3', 'NaN', 'Infinity'])('rejects %j', (value) => {
    expect(isApiAmount(value)).toBe(false);
  });
});

describe('validateClaimAmount', () => {
  // ETH-like asset from the docs: 8 decimals, min 0.01, fee 0.0012.
  const rules: ClaimAmountRules = { decimals: 8, minAmount: '0.01', available: '2.5', fee: '0.0012' };

  it('accepts a valid amount and returns it in canonical form', () => {
    expect(validateClaimAmount('0.5', rules)).toEqual({ isValid: true, amount: '0.5' });
  });

  it('normalizes before validating', () => {
    expect(validateClaimAmount(' ,5 ', rules)).toEqual({ isValid: true, amount: '0.5' });
  });

  it('drops trailing zeros, so the same amount is always sent as the same string (idempotent resend)', () => {
    expect(validateClaimAmount('0.50', rules)).toEqual({ isValid: true, amount: '0.5' });
    expect(validateClaimAmount('2.0', rules)).toEqual({ isValid: true, amount: '2' });
  });

  it('accepts the edges: exactly the minimum and exactly the available amount', () => {
    expect(validateClaimAmount('0.01', rules)).toEqual({ isValid: true, amount: '0.01' });
    expect(validateClaimAmount('2.5', rules)).toEqual({ isValid: true, amount: '2.5' });
  });

  it('accepts exactly `decimals` places and rejects one more', () => {
    expect(validateClaimAmount('0.12345678', rules)).toEqual({ isValid: true, amount: '0.12345678' });
    expect(validateClaimAmount('0.123456789', rules)).toEqual({ isValid: false, reason: 'tooManyDecimals' });
  });

  it('counts decimals after dropping trailing zeros', () => {
    expect(validateClaimAmount('0.5000', { ...rules, decimals: 1 })).toEqual({ isValid: true, amount: '0.5' });
  });

  it('works for an asset without decimals', () => {
    const wholeUnits = { decimals: 0, minAmount: '1', available: '10', fee: '0' };
    expect(validateClaimAmount('3', wholeUnits)).toEqual({ isValid: true, amount: '3' });
    expect(validateClaimAmount('3.5', wholeUnits)).toEqual({ isValid: false, reason: 'tooManyDecimals' });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['1.', 'format'],
    ['1e-3', 'format'],
    ['1.2.3', 'format'],
    ['abc', 'format'],
    ['-1', 'format'],
    ['0', 'zero'],
    ['0.000', 'zero'],
    ['0.009', 'belowMin'],
    ['2.50000001', 'aboveAvailable'],
    ['100', 'aboveAvailable'],
  ] as const)('%j → %s', (input, reason) => {
    expect(validateClaimAmount(input, rules)).toEqual({ isValid: false, reason });
  });

  it('requires the user to receive more than zero', () => {
    const feeAboveMin = { decimals: 6, minAmount: '1', available: '50', fee: '2' };
    expect(validateClaimAmount('2', feeAboveMin)).toEqual({ isValid: false, reason: 'notAboveFee' }); // receives 0
    expect(validateClaimAmount('1.5', feeAboveMin)).toEqual({ isValid: false, reason: 'notAboveFee' });
    expect(validateClaimAmount('2.000001', feeAboveMin)).toEqual({ isValid: true, amount: '2.000001' });
  });

  it('reports the minimum before the balance when the balance is below the minimum', () => {
    const lowBalance = { ...rules, available: '0.005' };
    expect(validateClaimAmount('0.005', lowBalance)).toEqual({ isValid: false, reason: 'belowMin' });
  });

  it('compares exactly, without float errors', () => {
    // 0.1 + 0.2 !== 0.3 in floats; here the available balance is exactly 0.3.
    const exact = { decimals: 8, minAmount: '0.1', available: '0.3', fee: '0.1' };
    expect(validateClaimAmount('0.3', exact)).toEqual({ isValid: true, amount: '0.3' });
  });

  it('handles amounts beyond float precision', () => {
    const large = {
      decimals: 18,
      minAmount: '0.000000000000000001',
      available: '12345678901.123456789012345678',
      fee: '0',
    };
    expect(validateClaimAmount('12345678901.123456789012345678', large)).toEqual({
      isValid: true,
      amount: '12345678901.123456789012345678',
    });
    expect(validateClaimAmount('12345678901.123456789012345679', large)).toEqual({
      isValid: false,
      reason: 'aboveAvailable',
    });
  });
});

describe('receiveAmount', () => {
  it('is the amount minus the fee', () => {
    expect(receiveAmount('0.5', '0.0012')).toBe('0.4988');
  });

  it('stays in plain notation for tiny results', () => {
    expect(receiveAmount('0.00000002', '0.00000001')).toBe('0.00000001');
  });

  it('is null when nothing would be received', () => {
    expect(receiveAmount('0.0012', '0.0012')).toBeNull();
    expect(receiveAmount('0.001', '0.0012')).toBeNull();
  });

  it('is null for input that is not a valid amount yet', () => {
    expect(receiveAmount('1.', '0.0012')).toBeNull();
    expect(receiveAmount('', '0.0012')).toBeNull();
  });
});

describe('maxClaimAmount', () => {
  it('is the available balance when nothing is in flight', () => {
    expect(maxClaimAmount({ available: '820.413207', decimals: 6, inFlight: [] })).toBe('820.413207');
  });

  it('subtracts our claims that the snapshot may not show yet', () => {
    expect(maxClaimAmount({ available: '2.5', decimals: 8, inFlight: ['0.5', '1'] })).toBe('1');
  });

  it('never goes below zero', () => {
    expect(maxClaimAmount({ available: '0.3', decimals: 8, inFlight: ['0.5'] })).toBe('0');
  });

  it('rounds down to the asset decimals, never up', () => {
    expect(maxClaimAmount({ available: '1.123456789', decimals: 6, inFlight: [] })).toBe('1.123456');
    expect(maxClaimAmount({ available: '0.9999999', decimals: 2, inFlight: [] })).toBe('0.99');
  });

  it('returns a string that passes the API format', () => {
    expect(isApiAmount(maxClaimAmount({ available: '5.000000', decimals: 6, inFlight: [] }))).toBe(true);
    expect(maxClaimAmount({ available: '5.000000', decimals: 6, inFlight: [] })).toBe('5');
  });
});

describe('USD values', () => {
  const usdt = { available: '820.413207', pending: '50.12', claiming: '0', usdPrice: '1.0002' };
  const eth = { available: '0.5', pending: '0.1', claiming: '0.25', usdPrice: '3012.45' };

  it('multiplies exactly', () => {
    expect(usdValue('820.413207', '1.0002')).toBe('820.5772896414');
    expect(usdValue('0.00000001', '0.5')).toBe('0.000000005'); // plain notation, never "5e-9"
  });

  it('sums available balances for "available to claim"', () => {
    // 820.5772896414 + 1506.225
    expect(availableUsd([usdt, eth])).toBe('2326.8022896414');
  });

  it('sums available + pending + claiming for the total', () => {
    // USDT 870.533207 × 1.0002 = 870.7073136414; ETH 0.85 × 3012.45 = 2560.5825
    expect(totalUsd([usdt, eth])).toBe('3431.2898136414');
  });

  it('is "0" for no assets', () => {
    expect(availableUsd([])).toBe('0');
    expect(totalUsd([])).toBe('0');
  });
});

describe('formatAmount', () => {
  it.each([
    ['820.413207', 6, '820.413207'],
    ['1.123456789', 6, '1.123456'], // rounds down, never shows more than there is
    ['0.9999999', 2, '0.99'],
    ['50.12', 6, '50.12'], // no padding with zeros
    ['0', 6, '0'],
    ['0.00000001', 8, '0.00000001'], // plain notation, never "1e-8"
    ['0.00000001', 6, '0'],
    ['1234567.5', 2, '1,234,567.5'], // thousands separators
    ['12345678901.123456789012345678', 18, '12,345,678,901.123456789012345678'],
    ['-0.5', 8, '-0.5'], // activity amounts are signed
    ['-1.129', 2, '-1.12'], // toward zero: the magnitude is never overstated
  ] as const)('%s with %i decimals → %s', (amount, decimals, expected) => {
    expect(formatAmount(amount, decimals)).toBe(expected);
  });
});

describe('formatUsd', () => {
  it.each([
    ['2326.8022896414', '$2,326.80'],
    ['0.009', '$0.00'], // rounds down
    ['1.999', '$1.99'],
    ['0', '$0.00'],
    ['1234567.5', '$1,234,567.50'],
  ])('%s → %s', (value, expected) => {
    expect(formatUsd(value)).toBe(expected);
  });
});
