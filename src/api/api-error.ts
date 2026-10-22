/**
 * - network: no response at all (offline, DNS, CORS)
 * - http: the server answered with a non-2xx status
 * - parse: the response did not match the expected schema
 */
export type ApiErrorKind = 'network' | 'http' | 'parse';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Short text for the user. Technical details stay in `error.message` for logs. */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';
  if (error.kind === 'network') return 'No connection. Check your internet and try again.';
  if (error.kind === 'parse') return 'Unexpected response from the server.';
  if (error.status === 401 || error.status === 403) return 'You do not have access.';
  if (error.status === 404) return 'Not found.';
  if (error.status === 429) return 'Too many requests. Wait a moment and try again.';
  if (error.status && error.status >= 500) return 'Server error. Try again later.';
  return error.message;
}
