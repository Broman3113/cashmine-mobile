import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api-error';

const MAX_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Retry only what can succeed on a second try: no connection, server errors (5xx), rate limits (429).
 * A 4xx (including 401) or a wrong response shape fails the same way again, so retrying only spends API calls.
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.kind === 'network') return true;
  if (error.kind === 'http') return error.status === 429 || (error.status ?? 0) >= 500;
  return false;
}

/** A 429 says how long to wait; otherwise back off exponentially (1s, 2s, 4s... capped). */
export function getRetryDelay(failureCount: number, error: unknown): number {
  if (error instanceof ApiError && error.retryAfterMs !== undefined) return error.retryAfterMs;
  return Math.min(1000 * 2 ** failureCount, MAX_RETRY_DELAY_MS);
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryableError(error),
        retryDelay: getRetryDelay,
        // Data counts as fresh for 30s: moving between screens does not refetch it.
        staleTime: 30_000,
      },
      mutations: {
        // Money-moving requests are never repeated automatically. The claim flow resends on its own terms,
        // with the same Idempotency-Key and body.
        retry: false,
      },
    },
  });
}
