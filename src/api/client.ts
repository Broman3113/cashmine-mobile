import { z } from 'zod';

import { ApiError } from './api-error';
import { getToken, rejectToken } from './token-store';

/** The only place the API address is defined. The token is never part of it: it goes in a header. */
export const API_BASE_URL = 'https://task-api.cashmine.io';

type RequestOptions<TSchema extends z.ZodType> = {
  /** Validates the response body. The result type comes from the schema. */
  schema: TSchema;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Lets TanStack Query cancel requests that are no longer needed. */
  signal?: AbortSignal;
};

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().nullish(),
    retryAfterMs: z.number().nonnegative().nullish(),
  }),
});

/** The only place that talks to the API. */
export async function request<TSchema extends z.ZodType>(
  path: string,
  { schema, method = 'GET', query, body, headers, signal }: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  // Read once: if the token changes while this request is in flight, a 401 must not reject the new one.
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (signal?.aborted) throw error; // cancelled on purpose, not a network problem
    throw new ApiError('network', error instanceof Error ? error.message : 'Network request failed');
  }

  const data = await readJson(response);

  if (!response.ok) {
    if (response.status === 401 && token) rejectToken(token);
    throw toHttpError(response, data);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError('parse', `Unexpected response from ${method} ${path}: ${parsed.error.message}`, response.status);
  }
  return parsed.data;
}

/** Appends `path` and `query` to the base URL. */
export function buildUrl(path: string, query?: RequestOptions<z.ZodType>['query']): string {
  const url = new URL(path.replace(/^\/?/, '/'), API_BASE_URL);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Uses the API's error envelope when there is one; a proxy or gateway may answer with something else. */
function toHttpError(response: Response, data: unknown): ApiError {
  const envelope = errorEnvelopeSchema.safeParse(data);
  const details = envelope.success ? envelope.data.error : undefined;
  return new ApiError('http', details?.message ?? `HTTP ${response.status}`, response.status, {
    code: details?.code,
    field: details?.field ?? undefined,
    retryAfterMs: details?.retryAfterMs ?? retryAfterHeaderMs(response),
  });
}

/** `Retry-After` in seconds, the fallback when the body has no `retryAfterMs`. */
function retryAfterHeaderMs(response: Response): number | undefined {
  const seconds = Number(response.headers.get('Retry-After'));
  return response.headers.has('Retry-After') && Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}
