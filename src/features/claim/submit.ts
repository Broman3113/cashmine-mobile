import { ApiError } from '@/api';

import type { Claim } from './api';

export type ClaimRequest = { asset: string; amount: string; destinationId: string };

/** One user intent: the key and the exact body travel together, so every resend is byte-for-byte the same. */
export type ClaimAttempt = Readonly<{ idempotencyKey: string; body: Readonly<ClaimRequest> }>;

/** Created once, when the user confirms. Never inside a retry loop or a render. */
export function createClaimAttempt(body: ClaimRequest): ClaimAttempt {
  return { idempotencyKey: crypto.randomUUID(), body: { ...body } };
}

/**
 * The claim may or may not exist: the request never got an answer (network), or the server failed or timed
 * out while handling it (5xx, including 504). Resending the same key and body is safe and is the only way to
 * find out, since the API cannot list claims and we have no id yet.
 */
export function isUnknownOutcome(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.kind === 'network' || (error.kind === 'http' && (error.status ?? 0) >= 500);
}

/** 429: the request was not processed. Waiting retryAfterMs and resending the same key is correct. */
function isRateLimited(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 429;
}

const RESENDS = 3;

type SubmitOptions = {
  post: (attempt: ClaimAttempt) => Promise<Claim>;
  wait?: (ms: number) => Promise<void>;
};

/**
 * Sends the attempt, and resends it (same key, same body) up to 3 times while the outcome is unknown or the
 * server asks to slow down. Any other error (400, 401, 409...) is final and thrown at once.
 * If the outcome is still unknown after that, the error is thrown; "Check again" calls this with the same attempt.
 */
export async function submitClaimAttempt(attempt: ClaimAttempt, { post, wait = delay }: SubmitOptions): Promise<Claim> {
  for (let resend = 0; ; resend++) {
    try {
      return await post(attempt);
    } catch (error) {
      const canResend = resend < RESENDS && (isUnknownOutcome(error) || isRateLimited(error));
      if (!canResend) throw error;
      await wait(isRateLimited(error) ? (error.retryAfterMs ?? 1000) : 1000 * 2 ** resend);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
