import { ApiError } from './api-error';
import { createQueryClient, getRetryDelay, isRetryableError } from './query-client';

describe('isRetryableError', () => {
  it.each([
    ['no connection', new ApiError('network', 'Failed to fetch'), true],
    ['server error', new ApiError('http', 'Bad Gateway', 502), true],
    ['rate limit', new ApiError('http', 'Too Many Requests', 429), true],
    ['bad request', new ApiError('http', 'Invalid amount', 422), false],
    ['not found', new ApiError('http', 'Not Found', 404), false],
    ['no access', new ApiError('http', 'Unauthorized', 401), false],
    ['wrong response shape', new ApiError('parse', 'Unexpected response'), false],
    ['unknown error', new Error('boom'), false],
  ])('%s → %s', (_case, error, expected) => {
    expect(isRetryableError(error)).toBe(expected);
  });
});

describe('getRetryDelay', () => {
  it('waits as long as a 429 asks', () => {
    const rateLimited = new ApiError('http', 'Too many requests', 429, { retryAfterMs: 2300 });
    expect(getRetryDelay(0, rateLimited)).toBe(2300);
    expect(getRetryDelay(3, rateLimited)).toBe(2300);
  });

  it('backs off exponentially otherwise, capped at 30s', () => {
    const serverError = new ApiError('http', 'Unavailable', 503);
    expect(getRetryDelay(0, serverError)).toBe(1000);
    expect(getRetryDelay(1, serverError)).toBe(2000);
    expect(getRetryDelay(10, serverError)).toBe(30_000);
  });
});

describe('createQueryClient', () => {
  const defaults = createQueryClient().getDefaultOptions();
  const retry = defaults.queries?.retry as (failureCount: number, error: unknown) => boolean;

  it('retries a retryable query error at most twice', () => {
    const networkError = new ApiError('network', 'Failed to fetch');
    expect(retry(0, networkError)).toBe(true);
    expect(retry(1, networkError)).toBe(true);
    expect(retry(2, networkError)).toBe(false);
  });

  it('does not retry a non-retryable query error', () => {
    expect(retry(0, new ApiError('http', 'Invalid amount', 422))).toBe(false);
  });

  it('never retries mutations', () => {
    expect(defaults.mutations?.retry).toBe(false);
  });
});
