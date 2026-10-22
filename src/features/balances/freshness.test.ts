import { formatUpdatedAgo, getSnapshotAgeSeconds } from './freshness';

describe('getSnapshotAgeSeconds', () => {
  const asOf = '2026-10-22T18:00:00.000Z';
  const at = (iso: string) => Date.parse(iso);

  it('counts whole seconds since asOf', () => {
    expect(getSnapshotAgeSeconds(asOf, at('2026-10-22T18:00:12.900Z'))).toBe(12);
  });

  it('is 0, not negative, when the device clock is behind the server', () => {
    expect(getSnapshotAgeSeconds(asOf, at('2026-10-22T17:59:50.000Z'))).toBe(0);
  });
});

describe('formatUpdatedAgo', () => {
  it.each([
    [0, 'Updated just now'],
    [4, 'Updated just now'],
    [5, 'Updated 5s ago'],
    [59, 'Updated 59s ago'],
    [60, 'Updated 1 min ago'],
    [3599, 'Updated 59 min ago'],
    [3600, 'Updated over an hour ago'],
  ])('%i s → %s', (seconds, text) => {
    expect(formatUpdatedAgo(seconds)).toBe(text);
  });
});
