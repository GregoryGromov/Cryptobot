import type { ChatRow, Chats } from '@reinforce/server/dto';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookUser, Building2, Gem, House, type LucideIcon, PieChart, Plus, Power, ScrollText } from 'lucide-react';
import { toast } from '@reinforce/ui-react/sonner';
import { railFadeClass, railLabelClass, railRowClass, railSlotClass, unreadDotClass } from '~/app/shell/sidebar/rail';
import { RailTip } from '~/app/shell/sidebar/rail-tip';
import { useTopicPreview } from '~/contexts/conversation/ui/use-topic-preview';
import { useServerNow } from '~/shared/api/live';
import { AGENTS, type Agent } from '~/shared/api/mock/agents';
import { trpc } from '~/shared/api/trpc';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { AsyncView } from '~/shared/ui/async-view';
import { UnreadBadge } from '~/shared/ui/unread-badge';
import { useAgentActions, useAllStopped } from '../api/agent-store';
import { AgentAvatar } from './agent-avatar';

const DAY_MS = 86_400_000;

type NavTarget = '/' | '/portfolio' | '/rwa' | '/journal' | '/contacts' | '/rewards';

type NavWord = 'home' | 'portfolio' | 'rwa' | 'journal' | 'contacts' | 'rewards';

const NAV: readonly { readonly to: NavTarget; readonly icon: LucideIcon; readonly word: NavWord }[] = [
  { to: '/', icon: House, word: 'home' },
  { to: '/portfolio', icon: PieChart, word: 'portfolio' },
  { to: '/rwa', icon: Building2, word: 'rwa' },
  { to: '/journal', icon: ScrollText, word: 'journal' },
  { to: '/contacts', icon: BookUser, word: 'contacts' },
  { to: '/rewards', icon: Gem, word: 'rewards' },
];

const rowOf = (chats: Chats, agent: Agent): ChatRow | undefined =>
  agent.topic === chats.broker.key ? chats.broker : chats.talks.find((talk) => talk.key === agent.topic);

export function AgentsPanel({
  expanded,
  active,
  onNavigate,
}: {
  readonly expanded: boolean;
  readonly active: string | null;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('shell');
  const chats = useQuery(trpc.views.chats.queryOptions());
  const stopped = useAllStopped();
  const { allStopped, allResumed } = useAgentActions();
  return (
    <section aria-label={t('agents.label')} className="flex flex-col px-3 pt-2 pb-3">
      <ul className="flex flex-col gap-0.5">
        {NAV.map((row) => (
          <li key={row.to} className="flex">
            <NavRow row={row} expanded={expanded} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
      <div className={cn('mt-2 flex h-8 items-center ps-3 pe-0.5', !expanded && 'hidden')}>
        <span className="flex-1 font-medium text-muted-foreground text-xs">{t('agents.label')}</span>
        <button
          type="button"
          aria-label={stopped ? t('agents.journal.kill.resume') : t('agents.killAll')}
          title={stopped ? t('agents.journal.kill.resume') : t('agents.killAll')}
          onClick={stopped ? allResumed : allStopped}
          className={cn(
            'focus-ring hover-neutral-soft inline-flex size-7 items-center justify-center rounded-md',
            stopped ? 'text-down' : 'text-muted-foreground hover:text-down',
          )}
        >
          <Power strokeWidth={1.9} className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t('agents.add')}
          title={t('agents.add')}
          onClick={() => toast(t('agents.soon'))}
          className="focus-ring hover-neutral-soft inline-flex size-7 items-center justify-center rounded-md text-muted-foreground"
        >
          <Plus strokeWidth={1.9} className="size-4" />
        </button>
      </div>
      <AsyncView query={chats} errorTitle={t('topics.failed')} loading={<AgentsTwin expanded={expanded} />}>
        {(data) => (
          <ul className="flex flex-col gap-0.5">
            {AGENTS.map((agent) => (
              <li key={agent.key} className="flex">
                <AgentRow
                  agent={agent}
                  row={rowOf(data, agent)}
                  current={agent.topic === active}
                  expanded={expanded}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        )}
      </AsyncView>
    </section>
  );
}

function NavRow({
  row,
  expanded,
  onNavigate,
}: {
  readonly row: (typeof NAV)[number];
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('common');
  const Icon = row.icon;
  const label = t(`nav.${row.word}`);
  return (
    <RailTip label={label} enabled={!expanded}>
      <Link to={row.to} activeOptions={{ exact: true }} onClick={onNavigate} className={railRowClass(expanded)}>
        <span className={railSlotClass(expanded)}>
          <Icon strokeWidth={1.9} className="size-4.5" />
        </span>
        <span className={cn(railLabelClass(expanded), 'ms-1 font-medium text-sm')}>{label}</span>
      </Link>
    </RailTip>
  );
}

function AgentRow({
  agent,
  row,
  current,
  expanded,
  onNavigate,
}: {
  readonly agent: Agent;
  readonly row: ChatRow | undefined;
  readonly current: boolean;
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('shell');
  const f = useFormatters();
  const previewOf = useTopicPreview();
  const now = useServerNow(60_000);
  const unread = current || !row ? 0 : row.unread;
  const preview = row ? previewOf(row).replaceAll('**', '') : agent.about;
  const when = row ? (now - row.at < DAY_MS ? f.clock(row.at) : f.day(row.at)) : null;
  return (
    <RailTip label={agent.name} enabled={!expanded}>
      <Link
        {...topicLink(agent.topic)}
        activeOptions={{ exact: true, includeSearch: false }}
        onClick={onNavigate}
        className={cn(railRowClass(expanded), 'h-auto min-h-14 py-2')}
      >
        <span className={railSlotClass(expanded)}>
          <span className="relative flex">
            <AgentAvatar agent={agent} />
            {unread > 0 && <span aria-hidden className={cn(unreadDotClass, railFadeClass(!expanded))} />}
          </span>
        </span>
        <span className={cn(railLabelClass(expanded), 'ms-1 flex flex-col gap-0.5')}>
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate font-medium text-foreground text-sm">{agent.name}</span>
            {when && <span className="shrink-0 font-normal text-muted-foreground text-xs">{when}</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-normal text-meta text-muted-foreground">{preview}</span>
            <UnreadBadge count={unread} label={t('topics.unread', { count: unread })} />
          </span>
        </span>
      </Link>
    </RailTip>
  );
}

function AgentsTwin({ expanded }: { readonly expanded: boolean }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {AGENTS.map((agent) => (
        <li key={agent.key} className="flex h-14 items-center">
          <span className={railSlotClass(expanded)}>
            <Skeleton className="size-9 rounded-full" />
          </span>
          {expanded && (
            <span className="ms-1 flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-40" />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
