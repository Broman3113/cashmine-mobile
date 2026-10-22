import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api-error';

const MAX_RETRIES = 2;

/**
 * Retry only what can succeed on a second try: no connection, server errors (5xx), rate limits (429).
 * A 4xx or a wrong response shape fails the same way again, so retrying only spends API calls.
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.kind === 'network') return true;
  if (error.kind === 'http') return error.status === 429 || (error.status ?? 0) >= 500;
  return false;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryableError(error),
        // Data counts as fresh for 30s: moving between screens does not refetch it.
        staleTime: 30_000,
      },
      mutations: {
        // Money-moving requests are never repeated automatically.
        retry: false,
      },
    },
  });
}
