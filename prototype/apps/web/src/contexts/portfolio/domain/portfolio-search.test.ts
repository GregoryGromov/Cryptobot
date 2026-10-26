import { describe, expect, it } from 'vitest';
import { cycleOf, cycleSearch, portfolioSearch } from './portfolio-search';

describe('portfolioSearch', () => {
  it('keeps a cycle for each book apart', () => {
    const search = portfolioSearch.parse({ userCycle: 'u-1', agentCycle: 'a-2' });
    expect([cycleOf(search, 'user'), cycleOf(search, 'agent')]).toEqual(['u-1', 'a-2']);
  });

  it('drops a value it cannot read instead of failing the page', () => {
    expect(portfolioSearch.parse({ book: 'nobody', period: '2y' })).toEqual({});
  });
});

describe('cycleSearch', () => {
  it('writes the broker’s cycle without touching the user’s', () => {
    expect(cycleSearch('agent', 'a-1')).toEqual({ agentCycle: 'a-1' });
  });

  it('clears the user’s cycle back to the current one', () => {
    expect(cycleSearch('user', undefined)).toEqual({ userCycle: undefined });
  });
});
