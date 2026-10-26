import type { Chat, Quote, Side } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { topicKind } from '~/shared/routing/topics';

export type PositionTag =
  | { readonly kind: 'open'; readonly side: Side; readonly pnl: number | null }
  | { readonly kind: 'entering'; readonly side: Side };

export type HeadView =
  | { readonly kind: 'general' }
  | { readonly kind: 'talk'; readonly title: string | null }
  | {
      readonly kind: 'market';
      readonly market: Quote;
      readonly position: PositionTag | null;
      readonly trade: boolean;
    };

export const positionTag = (position: Chat['position']): PositionTag | null => {
  if (position === null) return null;
  return match(position)
    .returnType<PositionTag | null>()
    .with({ status: 'open' }, (open) => ({ kind: 'open', side: open.side, pnl: open.unrealized }))
    .with({ status: 'pending' }, (pending) => ({ kind: 'entering', side: pending.side }))
    .with({ status: 'closed' }, { status: 'rejected' }, () => null)
    .exhaustive();
};

export const headView = (chat: Pick<Chat, 'key' | 'title' | 'market' | 'position' | 'ticket'>): HeadView =>
  match(topicKind(chat.key))
    .returnType<HeadView>()
    .with({ kind: 'general' }, () => ({ kind: 'general' }))
    .with({ kind: 'talk' }, () => ({ kind: 'talk', title: chat.title }))
    .with({ kind: 'market' }, ({ market }) =>
      chat.market
        ? {
            kind: 'market',
            market: chat.market,
            position: positionTag(chat.position),
            trade: chat.ticket !== null,
          }
        : { kind: 'talk', title: market },
    )
    .exhaustive();
