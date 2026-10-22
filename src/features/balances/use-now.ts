import { useEffect, useState } from 'react';

/** Current time, updated every `intervalMs`, so "Updated 12s ago" keeps counting between refetches. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
