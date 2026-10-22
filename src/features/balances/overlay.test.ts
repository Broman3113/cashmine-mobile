import type { Balances } from './api';
import { applyInFlightClaims } from './overlay';

const snapshot = (asOf: string): Balances => ({
  asOf,
  items: [
    { asset: 'ETH', decimals: 8, available: '2.5', pending: '0.1', claiming: '0', usdPrice: '3000' },
    { asset: 'USDT', decimals: 6, available: '100', pending: '0', claiming: '5', usdPrice: '1' },
  ],
});

const claim = { id: 'clm_1', asset: 'ETH', amount: '0.5', createdAt: '2026-10-22T18:00:05.000Z' };

describe('applyInFlightClaims', () => {
  it('moves a claim newer than the snapshot from available to claiming', () => {
    const adjusted = applyInFlightClaims(snapshot('2026-10-22T18:00:00.000Z'), [claim]);
    expect(adjusted.items[0]).toMatchObject({ asset: 'ETH', available: '2', claiming: '0.5', pending: '0.1' });
    expect(adjusted.items[1]).toMatchObject({ asset: 'USDT', available: '100', claiming: '5' });
  });

  it('leaves the snapshot alone once its asOf is at the claim time (counted already, never twice)', () => {
    const atClaimTime = snapshot('2026-10-22T18:00:05.000Z');
    expect(applyInFlightClaims(atClaimTime, [claim])).toBe(atClaimTime);
  });

  it('leaves the snapshot alone once its asOf is after the claim time', () => {
    const later = snapshot('2026-10-22T18:00:15.000Z');
    expect(applyInFlightClaims(later, [claim])).toBe(later);
  });

  it('adds up several claims of one asset and only applies the ones the snapshot misses', () => {
    const claims = [
      { ...claim, id: 'old', amount: '1', createdAt: '2026-10-22T17:59:00.000Z' }, // already in the snapshot
      claim,
      { ...claim, id: 'clm_2', amount: '0.25', createdAt: '2026-10-22T18:00:07.000Z' },
    ];
    const adjusted = applyInFlightClaims(snapshot('2026-10-22T18:00:00.000Z'), claims);
    expect(adjusted.items[0]).toMatchObject({ available: '1.75', claiming: '0.75' });
  });

  it('never shows a negative available balance', () => {
    const big = { ...claim, amount: '3' };
    expect(applyInFlightClaims(snapshot('2026-10-22T18:00:00.000Z'), [big]).items[0].available).toBe('0');
  });

  it('ignores claims for assets the snapshot does not list', () => {
    const btc = { ...claim, asset: 'BTC' };
    const adjusted = applyInFlightClaims(snapshot('2026-10-22T18:00:00.000Z'), [btc]);
    expect(adjusted.items).toEqual(snapshot('2026-10-22T18:00:00.000Z').items);
  });
});
