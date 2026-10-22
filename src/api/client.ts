import type { z } from 'zod';

import { ApiError } from './api-error';

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

/** The only place that talks to the API. */
export async function request<TSchema extends z.ZodType>(
  path: string,
  { schema, method = 'GET', query, body, headers, signal }: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
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
    throw new ApiError('http', messageFrom(data) ?? `HTTP ${response.status}`, response.status);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError('parse', `Unexpected response from ${method} ${path}: ${parsed.error.message}`, response.status);
  }
  return parsed.data;
}

/**
 * Appends `path` and `query` to the base URL from env. The base URL may already carry the token,
 * in its path (`/t/abc`) or query (`?token=abc`); both are kept.
 */
export function buildUrl(path: string, query?: RequestOptions<z.ZodType>['query']): string {
  // Must be written out in full: Expo inlines EXPO_PUBLIC_* values only for literal process.env.NAME.
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw new Error('EXPO_PUBLIC_API_URL is not set. Add it to .env.local.');

  const url = new URL(base);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
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

/** Uses the server's own error text when it sends one, e.g. `{ "message": "Insufficient balance" }`. */
function messageFrom(data: unknown): string | undefined {
  if (data && typeof data === 'object') {
    const { message, error } = data as { message?: unknown; error?: unknown };
    if (typeof message === 'string') return message;
    if (typeof error === 'string') return error;
  }
  return undefined;
}
