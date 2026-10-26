import { Button } from '@reinforce/ui-react/button';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { useId, useRef } from 'react';
import { AgentAvatar } from '~/contexts/agents/ui/agent-avatar';
import { HomeFeatures } from '~/contexts/agents/ui/home-features';
import { AWAITING, agentOf, STARTERS } from '~/shared/api/mock/agents';
import { useSession } from '~/shared/api/session';
import { useArrival } from '~/shared/hooks/use-arrival';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { Composer } from './composer';
import { columnClass, floorClass } from './feed-classes';
import { LimitNote } from './limit-note';
import { useHomeLaunch } from './use-home-launch';

const AWAITING_AFTER_MS = 160;

const homeClass = 'relative flex flex-1 flex-col md:pt-[5vh] md:pb-6 lg:justify-center lg:pt-6';

// On a phone the composer stands at the bottom, in the thumb's reach and where the conversation keeps it, so sending
// does not move it; the greeting and the actions share the room above. From md up it stands under the greeting.
const homeFloorClass = cn(floorClass, 'order-last md:static md:order-none md:p-0 md:before:hidden');

const startersClass =
  '-mx-3 mb-3 flex min-w-0 items-center gap-1.5 overflow-x-auto overflow-y-hidden px-3 [scrollbar-width:none] md:-mx-4 md:px-4 [&>:first-child]:ms-auto [&>:last-child]:me-auto';

const starterClass = 'shrink-0 text-foreground-soft! hover:text-foreground!';

function Hello() {
  const { t } = useT('shell');
  const name = useSession().data?.user.name ?? '';
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <Heading as="h1" size="page" className="text-balance">
        {t('agents.home.hello', { name })}
      </Heading>
      <Text variant="muted" className="max-w-[33.75rem] text-balance text-row">
        {t('agents.home.lead')}
      </Text>
    </div>
  );
}

function Awaiting() {
  const { t } = useT('shell');
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="flex flex-col">
      <Heading as="h2" size="section" id={heading} className="px-1 pb-2 text-row">
        {t('agents.home.awaiting')}
      </Heading>
      <ul className="flex flex-col gap-1.5 max-sm:-mx-2">
        {AWAITING.map((action) => {
          const agent = agentOf(action.agent);
          return (
            <li key={action.text}>
              <Link
                {...topicLink(agent.topic)}
                className="focus-ring flex min-h-14 w-full items-center gap-3 rounded-(--radius) bg-foreground/4 py-2.5 ps-2.5 pe-3 transition-colors hover:bg-foreground/8 active:bg-foreground/10"
              >
                <AgentAvatar agent={agent} size="sm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-foreground text-row">{action.text}</span>
                  <span className="truncate text-meta text-muted-foreground">
                    {agent.name} · {action.meta}
                  </span>
                </span>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HomeScreen() {
  const { t } = useT('shell');
  const home = useHomeLaunch();
  const greeting = useRef<HTMLDivElement>(null);
  const starters = useRef<HTMLFieldSetElement>(null);
  const awaiting = useRef<HTMLDivElement>(null);
  useArrival(greeting, 'greeting');
  useArrival(starters, 'starters');
  useArrival(awaiting, 'signals', AWAITING_AFTER_MS);
  return (
    <div className={homeClass}>
      <div ref={greeting} className={cn(columnClass, 'px-4 max-md:mt-auto max-md:pt-6 md:pb-4.5 lg:pb-7.5')}>
        <Hello />
      </div>
      <div className={homeFloorClass}>
        <div className={cn(columnClass, 'px-3 md:px-4')}>
          <fieldset ref={starters} aria-label={t('agents.home.starters')} className={startersClass}>
            {STARTERS.map((text) => (
              <Button
                key={text}
                variant="secondary"
                size="sm"
                onClick={() => home.ask(text)}
                className={starterClass}
              >
                {text}
              </Button>
            ))}
          </fieldset>
          <LimitNote needsLogin={false} />
          <Composer placeholder={() => t('agents.home.placeholder')} pickTitle={null} onSay={home.say} />
        </div>
      </div>
      <div ref={awaiting} className={cn(columnClass, 'gap-8 px-4 pt-8 max-md:mb-auto max-md:pb-6 lg:pt-10')}>
        <HomeFeatures />
        <Awaiting />
      </div>
    </div>
  );
}
