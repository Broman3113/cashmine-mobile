import { z } from 'zod';

const AMOUNT_FORMAT = /^\d+(\.\d{1,8})?$/;
const ZERO = /^0+(\.0+)?$/;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

// Messages say what to do, not what went wrong ("Enter an amount", not "Invalid input").
// Checks run in order and the form shows the first failing one.
export const withdrawSchema = z.object({
  amount: z
    .string()
    .trim()
    // Some mobile keyboards only offer a comma as the decimal separator.
    .transform((value) => value.replace(',', '.'))
    .pipe(
      z
        .string()
        .min(1, 'Enter an amount')
        .regex(AMOUNT_FORMAT, 'Use digits and one dot, up to 8 decimals, e.g. 12.5')
        .refine((value) => !ZERO.test(value), 'Amount must be greater than 0'),
    ),
  address: z
    .string()
    .trim()
    .min(1, 'Enter a wallet address')
    .regex(EVM_ADDRESS, 'Enter an EVM address: 0x followed by 40 hex characters'),
  note: z.string().trim().max(64, 'Keep the note under 64 characters'),
});

/** What the inputs hold (strings as typed). */
export type WithdrawFormValues = z.input<typeof withdrawSchema>;
/** What gets submitted (trimmed, comma normalized). */
export type WithdrawRequest = z.output<typeof withdrawSchema>;
