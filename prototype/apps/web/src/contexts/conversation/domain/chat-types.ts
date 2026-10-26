import type { Chat, ChatItem, ChatMessage, MarketName } from '@reinforce/server/dto';

export type Pending = Chat['pending'][number];
export type WaitKind = Pending['kind'];
export type FailedItem = Extract<ChatItem, { kind: 'failed' }>;
export type MentionItem = Extract<ChatItem, { kind: 'mention' }>;
export type MessageOption = NonNullable<ChatMessage['options']>[number];
export type Asset = MarketName & { readonly key: string };

export const isUserMessage = (item: ChatItem): item is ChatMessage =>
  item.kind === 'message' && item.role === 'user';

export const isBrokerMessage = (item: ChatItem | undefined): item is ChatMessage =>
  item?.kind === 'message' && item.role === 'broker';
