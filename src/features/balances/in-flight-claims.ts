import { useSyncExternalStore } from 'react';

/** A claim we created that a balances snapshot may not include yet. */
export type InFlightClaim = {
  id: string;
  asset: string;
  amount: string;
  /** Server time, compared with the snapshot's `asOf`. */
  createdAt: string;
};

// In memory only: a reload forgets them (listed as not done). Cleared on token change by the root layout.
let claims: readonly InFlightClaim[] = [];
const listeners = new Set<() => void>();

export function addInFlightClaim(claim: InFlightClaim): void {
  update([...claims.filter((known) => known.id !== claim.id), claim]);
}

/** A failed claim returns its amount to available at once, so its adjustment must go before the next snapshot. */
export function removeInFlightClaim(id: string): void {
  update(claims.filter((claim) => claim.id !== id));
}

export function clearInFlightClaims(): void {
  update([]);
}

export function useInFlightClaims(): readonly InFlightClaim[] {
  return useSyncExternalStore(subscribe, getClaims, getClaims);
}

function getClaims() {
  return claims;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: readonly InFlightClaim[]) {
  claims = next;
  listeners.forEach((listener) => listener());
}
