import { describe, expect, it } from 'vitest';
import { demoStandings, type Standings } from './demo-standings';
import { raceLines, spreadLabels, standingsView } from './standings-vm';

const NOW = new Date(2026, 9, 16, 12, 30).getTime();
const standings: Standings = demoStandings(NOW);

describe('standingsView', () => {
  it('puts the person 37th of 412, better than 91 percent', () => {
    const view = standingsView(standings, NOW);
    expect([view.me.rank, view.total, view.betterThan]).toEqual([37, 412, 91]);
  });

  it('names the place ahead and how far it is', () => {
    const view = standingsView(standings, NOW);
    expect(view.next?.rank).toBe(36);
    expect(view.next?.gap).toBeCloseTo(0.3, 5);
  });

  it('shows the podium, then two places either side of the person', () => {
    const view = standingsView(standings, NOW);
    expect(view.podium.map((entrant) => entrant.rank)).toEqual([1, 2, 3]);
    expect(view.around.map((entrant) => entrant.rank)).toEqual([35, 36, 37, 38, 39]);
  });

  it('counts the places between the podium and the neighbours', () => {
    expect(standingsView(standings, NOW).hidden).toBe(31);
  });

  it('counts down to the finish in days and hours', () => {
    expect(standingsView(standings, NOW).left).toEqual({ days: 5, hours: 11 });
  });

  it('has nothing left once the finish has passed', () => {
    expect(standingsView(standings, standings.endsAt + 1).left).toBeNull();
  });

  it('starts the race eight days before today', () => {
    expect(new Date(standings.startsAt).getDate()).toBe(8);
    expect(new Date(standings.endsAt).getDate()).toBe(22);
  });
});

describe('raceLines', () => {
  it('races the person against the five leaders and BTC', () => {
    expect(raceLines(standings, 'leaders').map((line) => line.id)).toEqual([
      'nightowl_sol',
      'kira.trades',
      'degen_dima',
      'mark_ai',
      'lenka',
      'BTC',
      'me',
    ]);
  });

  it('races the person against the neighbours and BTC', () => {
    expect(raceLines(standings, 'neighbors').map((line) => line.id)).toEqual([
      'misha_k',
      'vera.eth',
      'den_crypto',
      'yulia',
      'BTC',
      'me',
    ]);
  });

  it('ends every line at its return', () => {
    const me = raceLines(standings, 'leaders').at(-1);
    expect(me?.last).toBeCloseTo(4.8, 5);
  });
});

describe('spreadLabels', () => {
  it('keeps labels that do not touch where they are', () => {
    expect(spreadLabels([10, 50, 90], 20, 0, 100)).toEqual([10, 50, 90]);
  });

  it('pushes a crowded label down, keeping the input order', () => {
    expect(spreadLabels([40, 30, 80], 20, 0, 100)).toEqual([50, 30, 80]);
  });

  it('lifts the labels back up from the bottom edge', () => {
    expect(spreadLabels([95, 98], 20, 0, 100)).toEqual([80, 100]);
  });
});
