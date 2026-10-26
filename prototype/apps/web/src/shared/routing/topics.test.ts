import { describe, expect, it } from 'vitest';
import { assetCode, tickerOf, topicLink } from './topics';

describe('topic links', () => {
  it('opens the general conversation at /c', () => {
    expect(topicLink('broker')).toEqual({ to: '/c' });
  });

  it('opens a talk by its id', () => {
    expect(topicLink('talk-7f3a')).toEqual({ to: '/c/$talk', params: { talk: '7f3a' } });
  });

  it('opens a market by its ticker', () => {
    expect(topicLink('GOLD')).toEqual({ to: '/m/$market', params: { market: 'GOLD' } });
  });
});

describe('asset names', () => {
  it('drops the dex prefix of a coin', () => {
    expect(tickerOf('xyz:GOLD')).toBe('GOLD');
  });

  it('writes an asset code in capitals with a dollar sign', () => {
    expect(assetCode('btc')).toBe('$BTC');
  });
});
