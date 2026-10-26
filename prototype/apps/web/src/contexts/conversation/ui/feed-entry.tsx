import type { ChatItem } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { CheckLine } from '~/contexts/forecast/ui/check-line';
import { ChatSignal } from '~/contexts/signals/ui/chat-signal';
import type { FailedItem } from '../domain/chat-types';
import type { EntryPart, Who } from '../domain/feed';
import { FailedLine } from './failed-line';
import { enterClass } from './feed-classes';
import { MentionLine } from './mention-line';
import { type EntryContext, MessageEntry } from './message-entry';

export type Entering = 'still' | 'fresh' | 'landed';

const ALIGN: Record<Who, string> = {
  user: 'items-end',
  broker: 'items-start',
  note: 'items-center',
};

const spacing = (who: Who, follows: boolean): string => {
  if (follows) return who === 'user' ? 'mt-1.5' : 'mt-3';
  return who === 'user' ? 'mt-8' : 'mt-6';
};

export function Entry({
  who,
  follows,
  entering,
  children,
}: {
  readonly who: Who;
  readonly follows: boolean;
  readonly entering: Entering;
  readonly children: ReactNode;
}) {
  return (
    <div
      data-entry=""
      data-who={who}
      data-fresh={entering === 'still' ? undefined : ''}
      className={cn(
        'flex w-full min-w-0 flex-col first:mt-0',
        ALIGN[who],
        spacing(who, follows),
        entering === 'fresh' && enterClass,
      )}
    >
      {children}
    </div>
  );
}

export function EntryBody({
  item,
  part,
  failure,
  context,
}: {
  readonly item: ChatItem;
  readonly part: EntryPart;
  readonly failure: FailedItem | null;
  readonly context: EntryContext;
}) {
  return match(item)
    .with({ kind: 'message' }, (message) => <MessageEntry message={message} part={part} context={context} />)
    .with({ kind: 'signal' }, (signal) => (
      <div className="flex w-full flex-col items-center gap-1.5">
        <ChatSignal signal={signal} />
        {failure && <FailedLine failure={failure} />}
      </div>
    ))
    .with({ kind: 'check' }, (check) => <CheckLine check={check} />)
    .with({ kind: 'failed' }, (failed) => <FailedLine failure={failed} />)
    .with({ kind: 'mention' }, (mention) => <MentionLine mention={mention} />)
    .exhaustive();
}
