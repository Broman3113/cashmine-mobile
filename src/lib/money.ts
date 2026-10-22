import { Big } from 'big.js';

// Amounts are decimal strings in the asset's unit. All math goes through big.js; strings leave this file
// via toFixed(), which never uses exponent notation ("0.00000001", not "1e-8").

/** The API's amount format: no leading zeros, no lone dot, no exponent ("0.5", "12"). */
const API_AMOUNT = /^(0|[1-9]\d*)(\.\d+)?$/;
/** What a user may have typed so far into an amount field: digits with at most one dot, possibly unfinished. */
const PARTIAL_AMOUNT = /^\d*\.?\d*$/;

export type ClaimAmountRules = {
  decimals: number;
  minAmount: string;
  available: string;
  fee: string;
};

export type ClaimAmountInvalidReason =
  'empty' | 'format' | 'zero' | 'tooManyDecimals' | 'belowMin' | 'aboveAvailable' | 'notAboveFee';

export type ClaimAmountResult =
  { isValid: true; amount: string } | { isValid: false; reason: ClaimAmountInvalidReason };

export type BalanceAmounts = {
  available: string;
  pending: string;
  claiming: string;
  usdPrice: string;
};

/**
 * Cleans up amount input while the user types: trims, `,` → `.`, ".5" → "0.5", "05" → "5".
 * Unfinished input ("1.") is kept so typing can continue; anything else is left for validation to explain.
 */
export function normalizeAmountInput(raw: string): string {
  const value = raw.trim().replaceAll(',', '.');
  if (!PARTIAL_AMOUNT.test(value) || value === '') return value;

  const [integerPart, fractionPart] = value.split('.');
  const integer = integerPart.replace(/^0+(?=\d)/, '') || '0';
  return fractionPart === undefined ? integer : `${integer}.${fractionPart}`;
}

/** For when the field loses focus: like normalizeAmountInput, and a dangling dot is dropped ("1." → "1"). */
export function finalizeAmountInput(raw: string): string {
  const value = normalizeAmountInput(raw);
  return PARTIAL_AMOUNT.test(value) && value.endsWith('.') ? value.slice(0, -1) : value;
}

export function isApiAmount(value: string): boolean {
  return API_AMOUNT.test(value);
}

/**
 * Checks a claim amount against the API rules: minAmount ≤ amount ≤ available, at most `decimals` places,
 * and the user must receive something after the fee. A valid amount comes back in canonical form
 * (no trailing zeros), so the same amount is always sent as the same string.
 */
export function validateClaimAmount(input: string, rules: ClaimAmountRules): ClaimAmountResult {
  const value = normalizeAmountInput(input);
  if (value === '') return { isValid: false, reason: 'empty' };
  if (!isApiAmount(value)) return { isValid: false, reason: 'format' };

  const amount = new Big(value);
  if (amount.eq(0)) return { isValid: false, reason: 'zero' };

  const canonical = amount.toFixed();
  if (decimalPlaces(canonical) > rules.decimals) return { isValid: false, reason: 'tooManyDecimals' };
  // The minimum goes first: when the balance is below it, typing less cannot help.
  if (amount.lt(rules.minAmount)) return { isValid: false, reason: 'belowMin' };
  if (amount.gt(rules.available)) return { isValid: false, reason: 'aboveAvailable' };
  if (amount.minus(rules.fee).lte(0)) return { isValid: false, reason: 'notAboveFee' };

  return { isValid: true, amount: canonical };
}

/** What the user gets after the fee, or null when that is nothing or the amount is not valid yet. */
export function receiveAmount(amount: string, fee: string): string | null {
  if (!isApiAmount(amount)) return null;
  const received = new Big(amount).minus(fee);
  return received.gt(0) ? received.toFixed() : null;
}

/**
 * The most the user can claim now. The balance snapshot can lag behind our own claims by up to 15 s,
 * so claims we know are in flight are subtracted. Rounded down to what the asset allows.
 */
export function maxClaimAmount({
  available,
  decimals,
  inFlight,
}: {
  available: string;
  decimals: number;
  inFlight: readonly string[];
}): string {
  const free = inFlight.reduce((rest, amount) => rest.minus(amount), new Big(available));
  if (free.lte(0)) return '0';
  return free.round(decimals, Big.roundDown).toFixed();
}

/** Exact USD value of an amount. Round only for display (formatUsd). */
export function usdValue(amount: string, usdPrice: string): string {
  return new Big(amount).times(usdPrice).toFixed();
}

/** USD value of what can be claimed now. Pending is left out: it can still be reversed. */
export function availableUsd(balances: readonly BalanceAmounts[]): string {
  return sum(balances.map((balance) => new Big(balance.available).times(balance.usdPrice)));
}

/** USD value of everything: available, pending and claiming. */
export function totalUsd(balances: readonly BalanceAmounts[]): string {
  return sum(
    balances.map((balance) =>
      new Big(balance.available).plus(balance.pending).plus(balance.claiming).times(balance.usdPrice),
    ),
  );
}

/** Rounds toward zero to `decimals` places (never shows more than there is), en-US grouping, no padding. */
export function formatAmount(amount: string, decimals: number): string {
  return group(new Big(amount).round(decimals, Big.roundDown));
}

/** USD with exactly 2 decimals, rounded down: "$2,326.80". */
export function formatUsd(value: string): string {
  const rounded = group(new Big(value).round(2, Big.roundDown), 2);
  return rounded.startsWith('-') ? `-$${rounded.slice(1)}` : `$${rounded}`;
}

function sum(values: Big[]): string {
  return values.reduce((total, value) => total.plus(value), new Big(0)).toFixed();
}

function decimalPlaces(plain: string): number {
  return plain.split('.')[1]?.length ?? 0;
}

/** Plain notation with thousands separators. A result that rounded to zero loses its sign ("-0" → "0"). */
function group(value: Big, fixedDecimals?: number): string {
  const plain = (value.eq(0) ? new Big(0) : value).toFixed(fixedDecimals);
  const [integer, fraction] = plain.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}
