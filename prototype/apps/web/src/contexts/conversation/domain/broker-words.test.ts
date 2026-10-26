import { describe, expect, it } from 'vitest';
import { atomCount, plainWords, readyAtoms, wordBlocks, wordGroups } from './broker-words';

const kinds = (text: string) =>
  wordGroups(wordBlocks(text)).map((group) =>
    group.kind === 'list' ? `list:${group.points.length}` : `paragraph:${group.lines.length}`,
  );

describe('wordBlocks', () => {
  it('reads lines that start with a dash as points of one list', () => {
    expect(kinds('Вход скорее нет.\n\n- стоп 0,4 %\n- цель 0,3 %')).toEqual(['paragraph:1', 'list:2']);
  });

  it('reads a ticker after a dollar sign as the market, without its venue', () => {
    expect(wordBlocks('$xyz:nvda растёт')[0]?.atoms[0]).toEqual({
      kind: 'ticker',
      ticker: 'NVDA',
      tail: ' ',
      strong: false,
    });
  });

  it('leaves a sum in dollars as words', () => {
    expect(wordBlocks('лонг на $2000')[0]?.atoms.map((atom) => atom.kind)).toEqual(['word', 'word', 'word']);
  });

  it('reads a signed percent as a move up or down', () => {
    expect(
      wordBlocks('рост +1,2 % и спад -0.4%')[0]?.atoms.flatMap((atom) =>
        atom.kind === 'move' ? [`${atom.direction}:${atom.text}`] : [],
      ),
    ).toEqual(['up:+1,2 %', 'down:−0.4%']);
  });

  it('does not read a range as a move down', () => {
    expect(wordBlocks('около 5-10%')[0]?.atoms.some((atom) => atom.kind === 'move')).toBe(false);
  });

  it('marks words between double stars as strong and drops the stars', () => {
    expect(
      wordBlocks('**Не входить** сейчас')[0]?.atoms.map((atom) =>
        atom.kind === 'word' ? [atom.text, atom.strong] : [],
      ),
    ).toEqual([
      ['Не ', true],
      ['входить', true],
      [' ', false],
      ['сейчас', false],
    ]);
  });
});

describe('wordGroups', () => {
  it('shows only the atoms written so far', () => {
    const groups = wordGroups(wordBlocks('Раз два\n- три четыре'), 3);
    expect(
      groups.map((group) => (group.kind === 'list' ? group.points.flat().length : group.lines.flat().length)),
    ).toEqual([2, 1]);
  });
});

describe('readyAtoms', () => {
  it('holds back a word still being typed', () => {
    expect(readyAtoms('Золото держит', false)).toBe(1);
  });

  it('lays down a word followed by a space', () => {
    expect(readyAtoms('Золото держит ', false)).toBe(2);
  });

  it('lays down the last word once the stream stood still', () => {
    expect(readyAtoms('Золото держит', true)).toBe(2);
  });

  it('counts a ticker as one atom', () => {
    expect(atomCount(wordBlocks('$BTC держит'))).toBe(2);
  });
});

describe('plainWords', () => {
  it('says the words without marks', () => {
    expect(plainWords('**Не входить** в $BTC:\n- стоп')).toBe('Не входить в BTC:\n• стоп');
  });
});
