/**
 * @jest-environment node
 */
// Node environment: it has fetch and Response; the logic is the same on every platform.
import { z } from 'zod';

import { ApiError, getErrorMessage } from './api-error';
import { API_BASE_URL, buildUrl, request } from './client';
import { clearToken, getToken, getTokenState, setToken } from './token-store';

const schema = z.object({ id: z.string() });

function mockFetch(status: number, body: unknown, headers?: Record<string, string>) {
  return jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers }));
}

function sentHeaders(fetchSpy: ReturnType<typeof mockFetch>) {
  const [, init] = fetchSpy.mock.calls[0];
  return init?.headers as Record<string, string>;
}

beforeEach(() => setToken('test-token'));

afterEach(() => {
  jest.restoreAllMocks();
  clearToken();
});

describe('buildUrl', () => {
  it('appends the path to the base URL', () => {
    expect(buildUrl('/v1/balances')).toBe(`${API_BASE_URL}/v1/balances`);
    expect(buildUrl('v1/balances')).toBe(`${API_BASE_URL}/v1/balances`);
  });

  it('adds query params and skips undefined ones', () => {
    expect(buildUrl('/v1/activity', { limit: 20, cursor: undefined })).toBe(`${API_BASE_URL}/v1/activity?limit=20`);
  });

  it('never puts the token in the URL', () => {
    expect(buildUrl('/v1/balances')).not.toContain('test-token');
  });
});

describe('request', () => {
  it('returns data validated by the schema', async () => {
    mockFetch(200, { id: 'p1', extra: true });
    await expect(request('/v1/claims/p1', { schema })).resolves.toEqual({ id: 'p1' });
  });

  it('sends the token as a Bearer header', async () => {
    const fetchSpy = mockFetch(200, { id: 'p1' });
    await request('/v1/claims/p1', { schema });
    expect(sentHeaders(fetchSpy)).toMatchObject({ Authorization: 'Bearer test-token' });
  });

  it('sends no Authorization header without a token', async () => {
    clearToken();
    const fetchSpy = mockFetch(200, { id: 'p1' });
    await request('/v1/claims/p1', { schema });
    expect(sentHeaders(fetchSpy)).not.toHaveProperty('Authorization');
  });

  it('sends JSON bodies and extra headers', async () => {
    const fetchSpy = mockFetch(201, { id: 'c1' });
    await request('/v1/claims', {
      schema,
      method: 'POST',
      body: { amount: '1.5' },
      headers: { 'Idempotency-Key': 'key-1' },
    });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"amount":"1.5"}');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json', 'Idempotency-Key': 'key-1' });
  });

  it('reads code, message and field from the error envelope', async () => {
    mockFetch(400, { error: { code: 'VALIDATION', message: 'Amount is below the minimum', field: 'amount' } });
    await expect(request('/v1/claims', { schema, method: 'POST', body: {} })).rejects.toMatchObject({
      kind: 'http',
      status: 400,
      code: 'VALIDATION',
      field: 'amount',
      message: 'Amount is below the minimum',
    });
  });

  it('reads retryAfterMs from a 429 body', async () => {
    mockFetch(429, { error: { code: 'RATE_LIMITED', message: 'Too many requests', retryAfterMs: 2300 } });
    await expect(request('/v1/balances', { schema })).rejects.toMatchObject({ status: 429, retryAfterMs: 2300 });
  });

  it('falls back to the Retry-After header (seconds)', async () => {
    mockFetch(429, { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { 'Retry-After': '3' });
    await expect(request('/v1/balances', { schema })).rejects.toMatchObject({ retryAfterMs: 3000 });
  });

  it('keeps the status when the error body is not the API envelope', async () => {
    mockFetch(502, '<html>Bad Gateway</html>');
    await expect(request('/v1/balances', { schema })).rejects.toMatchObject({
      kind: 'http',
      status: 502,
      code: undefined,
      message: 'HTTP 502',
    });
  });

  it('rejects the token that got a 401', async () => {
    mockFetch(401, { error: { code: 'UNAUTHORIZED', message: 'Token expired' } });
    await expect(request('/v1/balances', { schema })).rejects.toMatchObject({ status: 401 });
    expect(getTokenState()).toEqual({ token: null, isRejected: true });
  });

  it('keeps a token entered while a request with the old one was in flight', async () => {
    let respond: (response: Response) => void = () => {};
    jest.spyOn(globalThis, 'fetch').mockReturnValue(new Promise((resolve) => (respond = resolve)));
    const pending = request('/v1/balances', { schema });

    setToken('new-token');
    respond(new Response(JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Expired' } }), { status: 401 }));

    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(getToken()).toBe('new-token');
  });

  it('turns a response of the wrong shape into a parse error', async () => {
    mockFetch(200, { id: 42 });
    await expect(request('/v1/claims/p1', { schema })).rejects.toMatchObject({ kind: 'parse' });
  });

  it('turns a failed fetch into a network error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(request('/v1/balances', { schema })).rejects.toMatchObject({ kind: 'network' });
  });

  it('rethrows a cancellation as is', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('Aborted', 'AbortError');
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);
    await expect(request('/v1/balances', { schema, signal: controller.signal })).rejects.toBe(abortError);
  });
});

describe('getErrorMessage', () => {
  it.each([
    [new ApiError('network', 'Failed to fetch'), 'No connection. Check your internet and try again.'],
    [new ApiError('parse', 'bad shape'), 'Unexpected response from the server.'],
    [new ApiError('http', 'Expired', 401), 'Your token was rejected or has expired. Enter it again.'],
    [new ApiError('http', 'Not Found', 404), 'Not found.'],
    [new ApiError('http', 'Too Many Requests', 429), 'Too many requests. Wait a moment and try again.'],
    [new ApiError('http', 'Timeout', 504), 'The server took too long to answer. Try again.'],
    [new ApiError('http', 'Unavailable', 503), 'Server error. Try again later.'],
    [new ApiError('http', 'Amount is below the minimum', 400), 'Amount is below the minimum'],
    [new Error('boom'), 'Something went wrong. Try again.'],
  ])('%s → %s', (error, message) => {
    expect(getErrorMessage(error)).toBe(message);
  });
});
