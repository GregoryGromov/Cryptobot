import { useEffect, useRef, useState } from 'react';
import { useFormatters } from '~/shared/format/use-formatters';
import { usePrefersReducedMotion } from '~/shared/hooks/use-media-query';
import { atomCount, readyAtoms, wordBlocks } from '../domain/broker-words';
import { WORD_IN_MS, WORD_SETTLE_MS, wordStepMs } from '../domain/stream';
import { BrokerWords } from './broker-words';
import { brokerTextClass } from './feed-classes';
import { stampWords } from './stamp';

function useWordReveal(ready: number, still: boolean): number {
  const [shown, setShown] = useState(() => Math.min(ready, 1));
  const due = useRef(0);
  useEffect(() => {
    if (still || shown >= ready) {
      due.current = 0;
      return;
    }
    const step = wordStepMs(ready - shown);
    let frame = requestAnimationFrame(function tick(now) {
      due.current ||= now - step;
      const count = Math.floor((now - due.current) / step);
      if (count < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      due.current += count * step;
      setShown((current) => Math.min(ready, current + count));
    });
    return () => cancelAnimationFrame(frame);
  }, [shown, ready, still]);
  return still ? ready : Math.min(shown, ready);
}

export function Writing({
  text,
  at,
  whole,
  onLaid,
}: {
  readonly text: string;
  readonly at: number;
  readonly whole: boolean;
  readonly onLaid?: () => void;
}) {
  const still = usePrefersReducedMotion();
  const f = useFormatters();
  const total = atomCount(wordBlocks(text));
  const [settledText, setSettledText] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledText(text), WORD_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [text]);
  const ready = whole ? total : readyAtoms(text, settledText === text);
  const shown = useWordReveal(ready, still);
  const done = whole && shown >= total;
  useEffect(() => {
    if (!done || !onLaid) return;
    const timer = window.setTimeout(onLaid, WORD_IN_MS);
    return () => window.clearTimeout(timer);
  }, [done, onLaid]);
  return (
    <div aria-hidden className={brokerTextClass} title={done ? stampWords(f.clock, at) : undefined}>
      <BrokerWords text={text} shown={shown} live={false} />
    </div>
  );
}
