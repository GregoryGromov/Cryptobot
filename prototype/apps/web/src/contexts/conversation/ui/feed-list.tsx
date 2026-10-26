import type { Chat } from '@reinforce/server/dto';
import { Fragment } from 'react';
import { match } from 'ts-pattern';
import { analysisOf, type HeldAnalysis } from '../domain/analysis';
import type { ConversationVm, Laid } from '../domain/conversation-vm';
import { RefusedLine } from './failed-line';
import { bubbleBodyClass, userBubbleClass } from './feed-classes';
import { Entry, EntryBody } from './feed-entry';
import { DayMarker, LiveBlock, UnreadLine } from './feed-markers';
import type { EntryContext } from './message-entry';
import { Coded, Speaker, Stamp } from './stamp';
import { WaitFor } from './waiting';
import { Writing } from './writing';

export function FeedList({
  vm,
  chat,
  analyses,
  context,
  now,
  onLaid,
}: {
  readonly vm: ConversationVm;
  readonly chat: Chat;
  readonly analyses: readonly HeldAnalysis[];
  readonly context: EntryContext;
  readonly now: number;
  readonly onLaid: (laid: Laid) => void;
}) {
  const stream = vm.stream;
  return (
    <>
      {vm.rows.map((row) =>
        match(row)
          .with({ kind: 'day' }, ({ key, at }) => <DayMarker key={key} at={at} now={now} />)
          .with({ kind: 'unread' }, ({ key }) => <UnreadLine key={key} />)
          .with({ kind: 'live' }, ({ key }) => <LiveBlock key={key} live={chat.live} />)
          .with({ kind: 'entry' }, ({ key, who, item, part, failure, follows }) => (
            <Entry key={key} who={who} follows={follows} entering={vm.entering(key)}>
              <EntryBody item={item} part={part} failure={failure} context={context} />
            </Entry>
          ))
          .exhaustive(),
      )}
      {vm.echoes.map((said, index) => (
        <Fragment key={said.requestId}>
          {index === 0 && vm.echoOpensDay && <DayMarker at={said.at} now={now} />}
          {said.text !== null && (
            <Entry who="user" follows={index > 0} entering={vm.entering(said.requestId)}>
              <div className={userBubbleClass}>
                <p className={bubbleBodyClass}>
                  <Speaker who="user" />
                  <Coded text={said.text} code={context.code} />
                  <Stamp at={said.at} />
                </p>
              </div>
            </Entry>
          )}
          {said.refused !== null && (
            <Entry who="note" follows={false} entering="fresh">
              <RefusedLine reason={said.refused} />
            </Entry>
          )}
        </Fragment>
      ))}
      {vm.waits.map(({ key, run }) => (
        <Entry key={key} who="broker" follows={vm.brokerFollows} entering={vm.entering(key)}>
          <WaitFor run={run} market={chat.market} progress={analysisOf(analyses, run.id, chat.seq)} />
        </Entry>
      ))}
      {match(stream)
        .with({ kind: 'none' }, () => null)
        .with({ kind: 'writing' }, ({ runId, text }) => (
          <Entry key={`stream-${runId}`} who="broker" follows={vm.brokerFollows} entering="landed">
            <Writing text={text} at={now} whole={false} />
          </Entry>
        ))
        .with({ kind: 'finishing' }, ({ runId, text, key, at }) => (
          <Entry key={`stream-${runId}`} who="broker" follows={vm.brokerFollows} entering="landed">
            <Writing text={text} at={at} whole onLaid={() => onLaid({ runId, key })} />
          </Entry>
        ))
        .exhaustive()}
    </>
  );
}
