import type { Journal } from '@reinforce/server/dto';
import { describe, expect, it } from 'vitest';
import { journalRows } from './journal-vm';

type Entry = Journal[number];
type HorizonForecast = Entry['forecasts'][number];

const UP_7 = { p_up: 0.7, p_flat: 0.2, p_down: 0.1 };
const EVEN = { p_up: 0.4, p_flat: 0.2, p_down: 0.4 };

const unresolved = (status: 'unresolved-data-quality' | 'pending-evaluation' | 'not-prospective') => ({
  status,
  returnPct: null,
  cls: null,
  brier: null,
  brierRef: null,
  inInterval: null,
});

const horizon = (
  minutes: 5 | 15 | 30 | 60,
  result: HorizonForecast['result'],
  probs = UP_7,
): HorizonForecast => ({
  horizon: minutes,
  probs,
  expected: 0.1,
  q: { q10: -0.2, q50: 0.1, q90: 0.3 },
  checkAt: 1_000 + minutes * 60_000,
  reference: null,
  result,
});

const resolved = (cls: 'UP' | 'FLAT' | 'DOWN') => ({
  status: 'resolved' as const,
  returnPct: 0.4,
  cls,
  brier: 0.2,
  brierRef: 0.3,
  inInterval: true,
});

const entry = (forecasts: HorizonForecast[], selected: 5 | 15 | 30 | 60 = 15): Entry => ({
  id: 'f1',
  coin: 'BTC',
  cohort: 'official',
  stateId: 's1',
  receivedAt: 1_000,
  t0: 1_000,
  deadline: null,
  origin: 'event',
  refines: null,
  versionId: 'v1',
  versionN: 2,
  runtime: 'local',
  attestation: 'platform-verified',
  p0: 100,
  stateClose: 100,
  forecasts,
  plan: {
    action: 'LONG',
    selected_horizon_minutes: selected,
    position_size_pct_nav: 50,
    stop_loss_pct: 1,
    take_profit_pct: 2,
  },
  rationale: null,
  levels: {},
  threadId: 't1',
});

describe('the forecast journal', () => {
  it('tells the term the person trades by whether what he held likelier came', () => {
    const journal = [entry([horizon(5, resolved('UP')), horizon(30, resolved('DOWN')), horizon(60, null)])];
    expect([journalRows(journal, 5)[0]?.check.mark, journalRows(journal, 30)[0]?.check.mark]).toEqual([
      'hit',
      'miss',
    ]);
  });

  it('tells a term he did not lean on apart from one he missed', () => {
    const [row] = journalRows([entry([horizon(30, resolved('UP'), EVEN)])], 30);
    expect(row?.check.mark).toBe('no-lean');
  });

  it('tells a term without prices and one not scored apart from a pending check', () => {
    const marks = (['unresolved-data-quality', 'not-prospective', 'pending-evaluation'] as const).map(
      (status) => journalRows([entry([horizon(30, unresolved(status))])], 30)[0]?.check.mark,
    );
    expect(marks).toEqual(['no-prices', 'not-scored', 'waiting']);
  });

  it('leads with his lean on the term the person trades, whatever term his own trade was for', () => {
    const [row] = journalRows([entry([horizon(15, null, EVEN), horizon(30, null)], 15)], 30);
    expect(row).toMatchObject({ horizon: 30, lean: { cls: 'UP', tenths: 7 } });
  });

  it('leaves out a forecast that has no such term', () => {
    expect(journalRows([entry([horizon(15, null)])], 30)).toEqual([]);
  });

  it('counts a forecast the person asked for as scored, and a late one as not', () => {
    const asked = { ...entry([horizon(30, null)]), cohort: 'on-demand' as const };
    const late = { ...entry([horizon(30, null)]), cohort: 'late' as const };
    expect(journalRows([asked, late], 30).map((row) => row.scored)).toEqual([true, false]);
  });
});
