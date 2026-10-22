import type { ClaimAmountInvalidReason, ClaimAmountRules } from '@/lib/money';

/** Tells the user what to do, not what failed. */
export function getAmountMessage(
  reason: ClaimAmountInvalidReason,
  { asset, decimals, minAmount, available, fee }: ClaimAmountRules & { asset: string },
): string {
  switch (reason) {
    case 'empty':
      return 'Enter an amount';
    case 'format':
      return 'Use digits and one dot, e.g. 0.5';
    case 'zero':
      return 'Enter an amount above 0';
    case 'tooManyDecimals':
      return decimals === 0 ? `Use whole ${asset}, no decimals` : `Use at most ${decimals} decimals`;
    case 'belowMin':
      return `Enter at least ${minAmount} ${asset}`;
    case 'aboveAvailable':
      return `You can claim up to ${available} ${asset}`;
    case 'notAboveFee':
      return `Enter more than the fee of ${fee} ${asset}`;
  }
}
