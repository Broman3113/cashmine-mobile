const STORAGE_KEY = 'cashmine.token';

// localStorage can throw (private mode, blocked site data). The token then lives in memory for this visit only.

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function writeStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Not saved: the user is asked for the token again on the next visit.
  }
}
