import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { request } from '@/api';
import { isApiAmount } from '@/lib/money';

import { submitClaimAttempt, type ClaimAttempt } from './submit';

const amountString = z.string().refine(isApiAmount, 'Expected a decimal string');

export const claimOptionsSchema = z.object({
  asset: z.string(),
  minAmount: amountString,
  fee: amountString,
  destinations: z.array(z.object({ id: z.string(), label: z.string() })),
});

export const claimSchema = z.object({
  id: z.string().min(1),
  asset: z.string(),
  amount: amountString,
  fee: amountString,
  receiveAmount: amountString,
  destinationId: z.string(),
  status: z.enum(['pending', 'completed', 'failed']),
  failureReason: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type ClaimOptions = z.infer<typeof claimOptionsSchema>;
export type Claim = z.infer<typeof claimSchema>;

export const claimKeys = {
  options: (asset: string) => ['claim-options', asset] as const,
  claim: (id: string) => ['claims', id] as const,
};

/** A pending claim settles in about 20 s. */
const POLL_INTERVAL_MS = 2000;

export function useClaimOptions(asset: string) {
  return useQuery({
    queryKey: claimKeys.options(asset),
    queryFn: ({ signal }) => request('/v1/claim-options', { schema: claimOptionsSchema, query: { asset }, signal }),
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: claimKeys.claim(id),
    queryFn: ({ signal }) => request(`/v1/claims/${encodeURIComponent(id)}`, { schema: claimSchema, signal }),
    // Poll until it settles; keep polling while there is no data yet (first load failed).
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' || !query.state.data ? POLL_INTERVAL_MS : false,
    staleTime: 0,
  });
}

/** retry: false (default): resending is done by submitClaimAttempt, always with the attempt's own key and body. */
export function useSubmitClaim() {
  return useMutation({ mutationFn: (attempt: ClaimAttempt) => submitClaimAttempt(attempt, { post: postClaim }) });
}

export function postClaim({ idempotencyKey, body }: ClaimAttempt): Promise<Claim> {
  return request('/v1/claims', {
    schema: claimSchema,
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}
