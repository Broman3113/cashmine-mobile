/**
 * @jest-environment node
 */
// Node environment: it has fetch and Response; the logic is the same on every platform.
import { z } from 'zod';

import { ApiError, getErrorMessage } from './api-error';
import { buildUrl, request } from './client';

const schema = z.object({ id: z.string() });

function mockFetch(status: number, body: unknown) {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://api.test/v1';
});

afterEach(() => jest.restoreAllMocks());

describe('buildUrl', () => {
  it('appends the path to the base URL', () => {
    expect(buildUrl('/payouts')).toBe('https://api.test/v1/payouts');
    expect(buildUrl('payouts')).toBe('https://api.test/v1/payouts');
  });

  it('keeps a token in the base path', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test/t/abc123/';
    expect(buildUrl('/payouts')).toBe('https://api.test/t/abc123/payouts');
  });

  it('keeps a token in the base query and adds query params', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test/v1?token=abc123';
    expect(buildUrl('/payouts', { page: 2, status: undefined })).toBe(
      'https://api.test/v1/payouts?token=abc123&page=2',
    );
  });

  it('fails clearly when the env variable is missing', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(() => buildUrl('/payouts')).toThrow('EXPO_PUBLIC_API_URL is not set');
  });
});

describe('request', () => {
  it('returns data validated by the schema', async () => {
    mockFetch(200, { id: 'p1', extra: true });
    await expect(request('/payouts/p1', { schema })).resolves.toEqual({ id: 'p1' });
  });

  it('sends JSON bodies', async () => {
    const fetchSpy = mockFetch(200, { id: 'p1' });
    await request('/payouts', { schema, method: 'POST', body: { amount: '1.5' } });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"amount":"1.5"}');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('turns a non-2xx response into an http error with the server message', async () => {
    mockFetch(422, { message: 'Insufficient balance' });
    await expect(request('/payouts', { schema })).rejects.toMatchObject({
      kind: 'http',
      status: 422,
      message: 'Insufficient balance',
    });
  });

  it('turns a response of the wrong shape into a parse error', async () => {
    mockFetch(200, { id: 42 });
    await expect(request('/payouts/p1', { schema })).rejects.toMatchObject({ kind: 'parse' });
  });

  it('turns a failed fetch into a network error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(request('/payouts', { schema })).rejects.toMatchObject({ kind: 'network' });
  });

  it('rethrows a cancellation as is', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('Aborted', 'AbortError');
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);
    await expect(request('/payouts', { schema, signal: controller.signal })).rejects.toBe(abortError);
  });
});

describe('getErrorMessage', () => {
  it.each([
    [new ApiError('network', 'Failed to fetch'), 'No connection. Check your internet and try again.'],
    [new ApiError('parse', 'bad shape'), 'Unexpected response from the server.'],
    [new ApiError('http', 'Unauthorized', 401), 'You do not have access.'],
    [new ApiError('http', 'Not Found', 404), 'Not found.'],
    [new ApiError('http', 'Too Many Requests', 429), 'Too many requests. Wait a moment and try again.'],
    [new ApiError('http', 'Bad Gateway', 502), 'Server error. Try again later.'],
    [new ApiError('http', 'Insufficient balance', 422), 'Insufficient balance'],
    [new Error('boom'), 'Something went wrong. Try again.'],
  ])('%s → %s', (error, message) => {
    expect(getErrorMessage(error)).toBe(message);
  });
});
