import { describe, expect, it } from 'vitest';
import { type ConversationVmInput, conversationVm } from './conversation-vm';
import { answer, chatOf, NOON, pending, said } from './fixtures.test-util';
import { saidAt } from './outbox';

const words = {
  starters: ['С чего начать?'],
  analysis: ['Что сейчас происходит?'],
  enter: 'Стоит ли входить сейчас?',
  again: 'Обнови прогноз',
};

const opening = chatOf({ items: [said('m1', 'Привет'), answer('m2', 'Здравствуйте')] });

const input = (over: Partial<ConversationVmInput>): ConversationVmInput => ({
  chat: opening,
  outbox: [],
  draft: null,
  laid: null,
  unreadFrom: null,
  opened: new Set(['m1', 'm2']),
  words,
  ...over,
});

describe('conversationVm', () => {
  it('lets entries that stood there when the conversation opened just stand', () => {
    expect(conversationVm(input({})).entering('m2')).toBe('still');
  });

  it('brings in an entry that came while the conversation was open', () => {
    const chat = chatOf({ items: [...opening.items, answer('m3', 'Новое')] });
    expect(conversationVm(input({ chat })).entering('m3')).toBe('fresh');
  });

  it('does not bring in again words that stood as an echo', () => {
    const outbox = [saidAt({ requestId: 'r1', text: 'Вопрос', wait: 'converse' }, NOON)];
    const chat = chatOf({ items: [...opening.items, { ...said('m3', 'Вопрос'), requestId: 'r1' }] });
    expect(conversationVm(input({ chat, outbox })).entering('m3')).toBe('landed');
  });

  it('shows the words just said and a wait for them before the server has them', () => {
    const outbox = [saidAt({ requestId: 'r1', text: 'Вопрос', wait: 'converse' }, NOON)];
    const vm = conversationVm(input({ outbox }));
    expect({ echoes: vm.echoes.map((item) => item.text), waits: vm.waits.map((row) => row.run.id) }).toEqual({
      echoes: ['Вопрос'],
      waits: ['r1'],
    });
  });

  it('times the wait for an analysis from when it was asked, not from when the server took it', () => {
    const outbox = [{ ...saidAt({ requestId: 'r1', text: null, wait: 'forecast' }, NOON), entry: 'd1' }];
    const chat = chatOf({
      items: opening.items,
      pending: [pending({ id: 'd1', kind: 'forecast', since: NOON + 3000 })],
    });
    expect(conversationVm(input({ chat, outbox })).waits.map((row) => row.run.since)).toEqual([NOON]);
  });

  it('offers no next questions while the broker is busy', () => {
    const chat = chatOf({ items: opening.items, pending: [pending({ id: 'run-1' })] });
    expect(conversationVm(input({ chat })).hints).toEqual([]);
  });

  it('announces the wait while the broker works', () => {
    const chat = chatOf({ items: opening.items, pending: [pending({ id: 'run-1', kind: 'forecast' })] });
    expect(conversationVm(input({ chat })).announcement).toEqual({ kind: 'waiting', wait: 'forecast' });
  });

  it('announces a broker answer that came while the conversation was open', () => {
    const chat = chatOf({ items: [...opening.items, answer('m3', 'Готово')] });
    expect(conversationVm(input({ chat })).announcement).toEqual({ kind: 'answer', text: 'Готово' });
  });

  it('announces nothing for answers that were already there', () => {
    expect(conversationVm(input({})).announcement).toEqual({ kind: 'none' });
  });

  it('shows the first look of a market nobody talked about', () => {
    const chat = chatOf({
      key: 'BTC',
      market: { coin: 'BTC', name: 'Bitcoin', ticker: 'BTC', cls: 'majors', price: 1, change1h: 0 },
    });
    expect(conversationVm(input({ chat, opened: new Set() })).firstLook).toBe(true);
  });
});
