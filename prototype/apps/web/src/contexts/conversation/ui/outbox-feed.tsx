import type { MarketName } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import type { Said } from '../domain/outbox';
import { bubbleBodyClass, columnClass, userBubbleClass } from './feed-classes';
import { Entry } from './feed-entry';
import { Speaker, Stamp } from './stamp';
import { WaitFor } from './waiting';

export function OutboxFeed({
  outbox,
  market,
}: {
  readonly outbox: readonly Said[];
  readonly market: MarketName | null;
}) {
  const lead = outbox[0];
  return (
    <div className={cn(columnClass, 'flex-1 px-4 pt-4 pb-6')}>
      {outbox.map(
        (said, index) =>
          said.text !== null && (
            <Entry key={said.requestId} who="user" follows={index > 0} entering="fresh">
              <div className={userBubbleClass}>
                <p className={bubbleBodyClass}>
                  <Speaker who="user" />
                  {said.text}
                  <Stamp at={said.at} />
                </p>
              </div>
            </Entry>
          ),
      )}
      {lead && (
        <Entry who="broker" follows={false} entering="fresh">
          <WaitFor
            run={{
              id: lead.requestId,
              kind: lead.wait,
              t0: null,
              deadline: null,
              since: lead.at,
              attempt: 1,
            }}
            market={market}
          />
        </Entry>
      )}
    </div>
  );
}
