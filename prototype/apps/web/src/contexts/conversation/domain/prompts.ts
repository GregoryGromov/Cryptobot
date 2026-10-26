import type { Chat, ChatItem, ChatMessage, Signals } from '@reinforce/server/dto';
import { plainWords } from './broker-words';
import { isBrokerMessage, isUserMessage } from './chat-types';

export type Hint = { readonly text: string; readonly analyze: boolean };

export type HintWords = {
  readonly starters: readonly string[];
  readonly analysis: readonly string[];
  /** The analysis offered beside the broker's own guesses before the market has a forecast. */
  readonly enter: string;
  readonly again: string;
};

const NOTABLE_HOUR_PCT = 0.5;

/** A market's last hour moved enough to be the first thing asked about it. */
export const movedNotably = (change1h: number | null): change1h is number =>
  change1h !== null && Math.abs(change1h) >= NOTABLE_HOUR_PCT;

const asked = (text: string): Hint => ({ text, analyze: false });
const analysed = (text: string): Hint => ({ text, analyze: true });

export const nextHints = (
  chat: Pick<Chat, 'items' | 'market' | 'latestThread'>,
  words: HintWords,
): readonly Hint[] => {
  const last = chat.items.at(-1);
  const next = isBrokerMessage(last) ? last.followUps.map((text) => asked(plainWords(text))) : [];
  if (!chat.market) return chat.items.some(isUserMessage) ? next : words.starters.map(asked);
  if (!chat.latestThread)
    return next.length > 0 ? [...next, analysed(words.enter)] : words.analysis.map(analysed);
  return [...next, analysed(words.again)];
};

/** What home offers to ask first: about what moved now, by a signal or else the hour's top mover, then its data. */
export type HomeAsk =
  | { readonly kind: 'why'; readonly ticker: string; readonly move: number; readonly horizon: number }
  | { readonly kind: 'data'; readonly ticker: string }
  | { readonly kind: 'start' | 'checks' };

const HOUR_MINUTES = 60;
const USUAL_TICKER = 'BTC';

export function homeAsks(signals: Signals | null): readonly HomeAsk[] {
  const lead = signals && !signals.quiet ? latest(signals.items) : null;
  if (lead) {
    const move = lead.direction === 'DOWN' ? -Math.abs(lead.move) : Math.abs(lead.move);
    return [
      { kind: 'why', ticker: lead.ticker, move, horizon: lead.horizon },
      { kind: 'data', ticker: lead.ticker },
      { kind: 'start' },
    ];
  }
  const mover = signals?.quiet?.movers[0];
  if (mover)
    return [
      { kind: 'why', ticker: mover.ticker, move: mover.change1h, horizon: HOUR_MINUTES },
      { kind: 'data', ticker: mover.ticker },
      { kind: 'start' },
    ];
  return [{ kind: 'data', ticker: USUAL_TICKER }, { kind: 'start' }, { kind: 'checks' }];
}

const latest = <T extends { readonly eventAt: number }>(items: readonly T[]): T | null =>
  items.reduce<T | null>((last, item) => (last === null || item.eventAt > last.eventAt ? item : last), null);

export const offersHints = (items: readonly ChatItem[], busy: boolean): boolean => {
  if (busy) return false;
  const last = items.at(-1);
  return last === undefined || isBrokerMessage(last);
};

export type Hello = { readonly head: string; readonly lead: string | null };

export const helloOf = (items: readonly ChatItem[], fallback: string): Hello => {
  const text = plainWords(items.find(isBrokerMessage)?.text.trim() ?? '') || fallback;
  const cut = text.indexOf('. ');
  return cut === -1
    ? { head: text, lead: null }
    : { head: text.slice(0, cut + 1), lead: text.slice(cut + 2) };
};

const TALK_TITLE_MAX = 60;

export const talkTitle = (text: string): string | null => {
  const line = (text.split('\n')[0] ?? '').trim();
  if (!line) return null;
  return line.length > TALK_TITLE_MAX ? `${line.slice(0, TALK_TITLE_MAX - 1).trimEnd()}…` : line;
};

export const codedText = (
  text: string,
  code: string | null,
): { readonly code: string | null; readonly rest: string } =>
  code !== null && (text === code || text.startsWith(`${code} `))
    ? { code, rest: text.slice(code.length) }
    : { code: null, rest: text };

export const brokerText = (message: ChatMessage): string | null => {
  const text = message.text.trimEnd();
  if (!text.trim()) return null;
  if (message.forecast !== null && text.trim() === message.forecast.thesis.trim()) return null;
  return text;
};
