import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { request } from '@/api';

/** Unsigned decimal string as the API sends it ("820.413207", "0"). */
const decimalString = z.string().regex(/^\d+(\.\d+)?$/, 'Expected a decimal string');

const assetBalanceSchema = z.object({
  asset: z.string().min(1),
  decimals: z.number().int().nonnegative(),
  available: decimalString,
  pending: decimalString,
  claiming: decimalString,
  usdPrice: decimalString,
});

export const balancesSchema = z.object({
  asOf: z.iso.datetime(),
  items: z.array(assetBalanceSchema),
});

export type AssetBalance = z.infer<typeof assetBalanceSchema>;
export type Balances = z.infer<typeof balancesSchema>;

export const balancesKeys = {
  all: ['balances'] as const,
};

/** The server recomputes the snapshot every 15 s, so polling faster only spends the per-token rate limit. */
const SNAPSHOT_INTERVAL_MS = 15_000;

export function useBalances() {
  return useQuery({
    queryKey: balancesKeys.all,
    queryFn: ({ signal }) => request('/v1/balances', { schema: balancesSchema, signal }),
    refetchInterval: SNAPSHOT_INTERVAL_MS,
  });
}
