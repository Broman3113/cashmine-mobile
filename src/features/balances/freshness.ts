/** A snapshot older than this is flagged: normally a new one arrives every 15 s. */
export const STALE_AFTER_SECONDS = 60;

/** Age of the snapshot from the server's `asOf`. A device clock running behind never gives a negative age. */
export function getSnapshotAgeSeconds(asOf: string, now: number): number {
  return Math.max(0, Math.floor((now - Date.parse(asOf)) / 1000));
}

export function formatUpdatedAgo(ageSeconds: number): string {
  if (ageSeconds < 5) return 'Updated just now';
  if (ageSeconds < 60) return `Updated ${ageSeconds}s ago`;
  if (ageSeconds < 3600) return `Updated ${Math.floor(ageSeconds / 60)} min ago`;
  return 'Updated over an hour ago';
}
