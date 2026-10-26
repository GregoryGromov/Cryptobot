import { useEffect, useState } from 'react';

/**
 * Whole seconds since `since` (server time), counted on the screen's own clock: the count steps once a second, on the
 * second, and never stalls or steps back as the estimate of the server's clock moves.
 */
export const useStopwatch = (since: number, serverNow: number): number => {
  const [anchor, setAnchor] = useState(() => ({
    since,
    origin: Date.now() - Math.max(0, serverNow - since),
  }));
  const [clock, setClock] = useState(Date.now);
  if (anchor.since !== since)
    setAnchor({ since, origin: Math.min(anchor.origin, clock - Math.max(0, serverNow - since)) });
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const now = Date.now();
      setClock(now);
      id = window.setTimeout(tick, 1_000 - ((now - anchor.origin) % 1_000));
    };
    id = window.setTimeout(tick, 1_000 - ((Date.now() - anchor.origin) % 1_000));
    return () => window.clearTimeout(id);
  }, [anchor.origin]);
  return Math.max(0, Math.floor((clock - anchor.origin) / 1_000));
};
