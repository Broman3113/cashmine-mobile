import { useSyncExternalStore } from 'react';

import { readStoredToken, writeStoredToken } from './token-storage';

export type TokenState = {
  token: string | null;
  /** The API answered 401 to the last token: wrong or expired. Cleared when a new token is set. */
  isRejected: boolean;
};

let state: TokenState = { token: readStoredToken(), isRejected: false };
const listeners = new Set<() => void>();

export function getToken(): string | null {
  return state.token;
}

export function getTokenState(): TokenState {
  return state;
}

/** Called on every token change (set, clear, reject). Returns the unsubscribe function. */
export function subscribeToToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setToken(token: string): void {
  update({ token: token.trim() || null, isRejected: false });
}

export function clearToken(): void {
  update({ token: null, isRejected: false });
}

/** After a 401. Only the token that was rejected is removed, not one the user entered meanwhile. */
export function rejectToken(token: string): void {
  if (state.token !== token) return;
  update({ token: null, isRejected: true });
}

export function useTokenState(): TokenState {
  return useSyncExternalStore(subscribeToToken, getTokenState, getTokenState);
}

function update(next: TokenState) {
  state = next;
  writeStoredToken(next.token);
  listeners.forEach((listener) => listener());
}
