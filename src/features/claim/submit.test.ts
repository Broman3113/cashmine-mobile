import { ApiError } from '@/api';

import type { Claim } from './api';
import { createClaimAttempt, submitClaimAttempt, type ClaimAttempt } from './submit';

const body = { asset: 'ETH', amount: '0.5', destinationId: 'dest_wallet' };

const claim: Claim = {
  id: 'clm_1',
  asset: 'ETH',
  amount: '0.5',
  fee: '0.0012',
  receiveAmount: '0.4988',
  destinationId: 'dest_wallet',
  status: 'pending',
  failureReason: null,
  createdAt: '2026-10-22T18:00:05.000Z',
  updatedAt: '2026-10-22T18:00:05.000Z',
};

const timeout = () => new ApiError('http', 'The server did not finish in time', 504, { code: 'TIMEOUT' });
const offline = () => new ApiError('network', 'Failed to fetch');

function setup(...results: (Claim | Error)[]) {
  const post = jest.fn<Promise<Claim>, [ClaimAttempt]>();
  for (const result of results) {
    if (result instanceof Error) post.mockRejectedValueOnce(result);
    else post.mockResolvedValueOnce(result);
  }
  const wait = jest.fn<Promise<void>, [number]>().mockResolvedValue();
  return { post, wait };
}

describe('createClaimAttempt', () => {
  it('creates a fresh key for each confirmed intent and copies the body', () => {
    const first = createClaimAttempt(body);
    const second = createClaimAttempt(body);
    expect(first.idempotencyKey).not.toBe(second.idempotencyKey);
    expect(first.idempotencyKey.length).toBeGreaterThan(0);
    expect(first.idempotencyKey.length).toBeLessThanOrEqual(100);
    expect(first.body).toEqual(body);
    expect(first.body).not.toBe(body); // later edits to the form cannot change what is resent
  });
});

describe('submitClaimAttempt', () => {
  const attempt = createClaimAttempt(body);

  it('returns the claim from the first answer', async () => {
    const { post, wait } = setup(claim);
    await expect(submitClaimAttempt(attempt, { post, wait })).resolves.toBe(claim);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('resends the same key and the same body after a 504 and a network error', async () => {
    const { post, wait } = setup(timeout(), offline(), claim);
    await expect(submitClaimAttempt(attempt, { post, wait })).resolves.toBe(claim);
    expect(post).toHaveBeenCalledTimes(3);
    for (const [sent] of post.mock.calls) {
      expect(sent).toBe(attempt);
      expect(sent.idempotencyKey).toBe(attempt.idempotencyKey);
      expect(sent.body).toEqual(body);
    }
  });

  it('resends after 500 and 503 too', async () => {
    const { post, wait } = setup(
      new ApiError('http', 'Server error', 500),
      new ApiError('http', 'Unavailable', 503),
      claim,
    );
    await expect(submitClaimAttempt(attempt, { post, wait })).resolves.toBe(claim);
    expect(post).toHaveBeenCalledTimes(3);
  });

  it('gives up after 3 resends and reports the outcome as still unknown', async () => {
    const { post, wait } = setup(timeout(), timeout(), timeout(), timeout(), claim);
    await expect(submitClaimAttempt(attempt, { post, wait })).rejects.toMatchObject({ status: 504 });
    expect(post).toHaveBeenCalledTimes(4); // first send + 3 resends
  });

  it('"Check again" with the same attempt can still find the claim', async () => {
    const { post, wait } = setup(timeout(), timeout(), timeout(), timeout(), claim);
    await expect(submitClaimAttempt(attempt, { post, wait })).rejects.toBeInstanceOf(ApiError);
    await expect(submitClaimAttempt(attempt, { post, wait })).resolves.toBe(claim);
    expect(new Set(post.mock.calls.map(([sent]) => sent.idempotencyKey))).toEqual(new Set([attempt.idempotencyKey]));
  });

  it('waits as long as a 429 asks before resending', async () => {
    const rateLimited = new ApiError('http', 'Too many requests', 429, { retryAfterMs: 2300 });
    const { post, wait } = setup(rateLimited, claim);
    await expect(submitClaimAttempt(attempt, { post, wait })).resolves.toBe(claim);
    expect(wait).toHaveBeenCalledWith(2300);
  });

  it.each([
    [
      '400 VALIDATION (not created)',
      new ApiError('http', 'Amount too high', 400, { code: 'VALIDATION', field: 'amount' }),
    ],
    ['409 IDEMPOTENCY_MISMATCH (a bug)', new ApiError('http', 'Key reused', 409, { code: 'IDEMPOTENCY_MISMATCH' })],
    ['401 (token)', new ApiError('http', 'Expired', 401)],
  ])('never resends after %s', async (_case, error) => {
    const { post, wait } = setup(error, claim);
    await expect(submitClaimAttempt(attempt, { post, wait })).rejects.toBe(error);
    expect(post).toHaveBeenCalledTimes(1);
  });
});
