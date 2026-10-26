/** Where a market's underlying trades: the US stock exchanges, the Korean one, or the CME futures. */
export type Venue = 'us' | 'krx' | 'cme';

/**
 * When the underlying of a market trades. Its perpetual on Hyperliquid trades around the clock, but with the exchange
 * shut it barely moves and may jump at the open.
 */
export type MarketHours =
  | { readonly venue: Venue; readonly open: true; readonly closesAt: number }
  | { readonly venue: Venue; readonly open: false; readonly opensAt: number };

// The underlying exchange of each market the feed carries outside crypto; a market not named here is not claimed.
const VENUES: Readonly<Record<string, Venue>> = {
  NVDA: 'us',
  META: 'us',
  INTC: 'us',
  SNDK: 'us',
  SOXL: 'us',
  CBRS: 'us',
  SP500: 'us',
  XYZ100: 'us',
  SKHX: 'krx',
  SKHY: 'krx',
  SMSN: 'krx',
  CL: 'cme',
  OIL: 'cme',
  BRENTOIL: 'cme',
  GOLD: 'cme',
  SILVER: 'cme',
};

const NEW_YORK = 'America/New_York';
const SEOUL = 'Asia/Seoul';

// NYSE and Nasdaq close on these days and close at 13:00 on the early ones; the list is the exchanges' own.
const US_HOLIDAYS = new Set([
  '2026-01-01',
  '2026-01-19',
  '2026-02-16',
  '2026-04-03',
  '2026-05-25',
  '2026-06-19',
  '2026-07-03',
  '2026-09-07',
  '2026-11-26',
  '2026-12-25',
  '2027-01-01',
  '2027-01-18',
  '2027-02-15',
  '2027-03-26',
  '2027-05-31',
  '2027-06-18',
  '2027-07-05',
  '2027-09-06',
  '2027-11-25',
  '2027-12-24',
]);
const US_EARLY = new Set(['2026-11-27', '2026-12-24', '2027-11-26']);

type Wall = { readonly day: string; readonly weekday: number; readonly minute: number };

const formats = new Map<string, Intl.DateTimeFormat>();
const formatIn = (zone: string): Intl.DateTimeFormat => {
  const known = formats.get(zone);
  if (known) return known;
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  formats.set(zone, format);
  return format;
};

const partsIn = (zone: string, at: number) => {
  const parts = Object.fromEntries(
    formatIn(zone)
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
};

const dayOf = (year: number, month: number, day: number): string =>
  new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);

const weekdayOf = (day: string): number => new Date(`${day}T00:00:00Z`).getUTCDay();

const nextDay = (day: string): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

const wallIn = (zone: string, at: number): Wall => {
  const p = partsIn(zone, at);
  const day = dayOf(p.year, p.month, p.day);
  return { day, weekday: weekdayOf(day), minute: p.hour * 60 + p.minute };
};

/** The instant a zone's clock shows `minute` past midnight of `day`. */
const instantIn = (zone: string, day: string, minute: number): number => {
  const naive = Date.parse(`${day}T00:00:00Z`) + minute * 60_000;
  const offset = (at: number) => {
    const p = partsIn(zone, at);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(at / 60_000) * 60_000;
  };
  const first = naive - offset(naive);
  return naive - offset(first);
};

type Sessions = {
  readonly zone: string;
  readonly trades: (day: string, weekday: number) => boolean;
  readonly opens: number;
  readonly closes: (day: string) => number;
};

const US: Sessions = {
  zone: NEW_YORK,
  trades: (day, weekday) => weekday >= 1 && weekday <= 5 && !US_HOLIDAYS.has(day),
  opens: 9 * 60 + 30,
  closes: (day) => (US_EARLY.has(day) ? 13 * 60 : 16 * 60),
};

const KRX: Sessions = {
  zone: SEOUL,
  trades: (_day, weekday) => weekday >= 1 && weekday <= 5,
  opens: 9 * 60,
  closes: () => 15 * 60 + 30,
};

const sessionHours = (venue: Venue, sessions: Sessions, at: number): MarketHours => {
  const { zone, trades, opens, closes } = sessions;
  const now = wallIn(zone, at);
  if (trades(now.day, now.weekday)) {
    if (now.minute >= opens && now.minute < closes(now.day))
      return { venue, open: true, closesAt: instantIn(zone, now.day, closes(now.day)) };
    if (now.minute < opens) return { venue, open: false, opensAt: instantIn(zone, now.day, opens) };
  }
  let day = nextDay(now.day);
  while (!trades(day, weekdayOf(day))) day = nextDay(day);
  return { venue, open: false, opensAt: instantIn(zone, day, opens) };
};

// CME trades from Sunday 18:00 to Friday 17:00 New York time, with an hour's halt at 17:00 on the days between.
const cmeHours = (at: number): MarketHours => {
  const now = wallIn(NEW_YORK, at);
  const halt = 17 * 60;
  const resume = 18 * 60;
  const shut =
    now.weekday === 6 ||
    (now.weekday === 0 && now.minute < resume) ||
    (now.weekday === 5 && now.minute >= halt) ||
    (now.minute >= halt && now.minute < resume);
  if (!shut) {
    const closesOn = now.minute < halt ? now.day : nextDay(now.day);
    return { venue: 'cme', open: true, closesAt: instantIn(NEW_YORK, closesOn, halt) };
  }
  let day = now.weekday === 0 || now.minute < resume ? now.day : nextDay(now.day);
  if (now.weekday === 5 || now.weekday === 6) while (weekdayOf(day) !== 0) day = nextDay(day);
  return { venue: 'cme', open: false, opensAt: instantIn(NEW_YORK, day, resume) };
};

/** The underlying exchange of a market, or null for crypto and the markets whose exchange is not known. */
export const venueOf = (coin: string): Venue | null => {
  const at = coin.indexOf(':');
  return at < 0 ? null : (VENUES[coin.slice(at + 1)] ?? null);
};

/** Whether a market's exchange trades at `at` and until when, or when it opens; null for a market always open. */
export const marketHours = (coin: string, at: number): MarketHours | null => {
  const venue = venueOf(coin);
  if (venue === 'us') return sessionHours(venue, US, at);
  if (venue === 'krx') return sessionHours(venue, KRX, at);
  if (venue === 'cme') return cmeHours(at);
  return null;
};
