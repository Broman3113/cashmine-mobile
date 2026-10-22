import { Big } from 'big.js';

import type { Balances } from './api';
import type { InFlightClaim } from './in-flight-claims';

/**
 * Shows our own claims right away (decision B): the amount moves from available to claiming until a snapshot
 * taken at or after the claim's creation arrives. From then on the snapshot already counts it, so it is
 * never subtracted twice. Both times come from the server, so the device clock plays no part.
 */
export function applyInFlightClaims(balances: Balances, claims: readonly InFlightClaim[]): Balances {
  const snapshotTime = Date.parse(balances.asOf);
  const notInSnapshot = claims.filter((claim) => Date.parse(claim.createdAt) > snapshotTime);
  if (notInSnapshot.length === 0) return balances;

  return {
    ...balances,
    items: balances.items.map((item) => {
      const amounts = notInSnapshot.filter((claim) => claim.asset === item.asset).map((claim) => claim.amount);
      if (amounts.length === 0) return item;
      const moved = amounts.reduce((total, amount) => total.plus(amount), new Big(0));
      const available = new Big(item.available).minus(moved);
      return {
        ...item,
        available: available.gt(0) ? available.toFixed() : '0',
        claiming: new Big(item.claiming).plus(moved).toFixed(),
      };
    }),
  };
}
