/**
 * - network: no response at all (offline, DNS, CORS)
 * - http: the server answered with a non-2xx status
 * - parse: the response did not match the expected schema
 */
export type ApiErrorKind = 'network' | 'http' | 'parse';

/** What the API puts in `{ "error": { ... } }` besides the message. */
export type ApiErrorDetails = {
  /** VALIDATION, UNAUTHORIZED, NOT_FOUND, IDEMPOTENCY_MISMATCH, RATE_LIMITED, SERVER, TIMEOUT */
  code?: string;
  /** The request field a VALIDATION error is about, e.g. "amount". */
  field?: string;
  /** How long to wait before trying again (429). */
  retryAfterMs?: number;
};

export class ApiError extends Error {
  readonly code?: string;
  readonly field?: string;
  readonly retryAfterMs?: number;

  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
    { code, field, retryAfterMs }: ApiErrorDetails = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.field = field;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Short text for the user. Technical details stay in `error.message` for logs. */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Try again.';
  if (error.kind === 'network') return 'No connection. Check your internet and try again.';
  if (error.kind === 'parse') return 'Unexpected response from the server.';
  if (error.status === 401) return 'Your token was rejected or has expired. Enter it again.';
  if (error.status === 404) return 'Not found.';
  if (error.status === 429) return 'Too many requests. Wait a moment and try again.';
  if (error.status === 504) return 'The server took too long to answer. Try again.';
  if (error.status && error.status >= 500) return 'Server error. Try again later.';
  return error.message;
}
