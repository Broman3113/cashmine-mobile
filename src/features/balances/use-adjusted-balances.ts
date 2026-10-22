import { useBalances } from './api';
import { useInFlightClaims } from './in-flight-claims';
import { applyInFlightClaims } from './overlay';

/** The balances query with our own in-flight claims applied (see applyInFlightClaims). */
export function useAdjustedBalances() {
  const query = useBalances();
  const claims = useInFlightClaims();
  return { ...query, data: query.data && applyInFlightClaims(query.data, claims) };
}
