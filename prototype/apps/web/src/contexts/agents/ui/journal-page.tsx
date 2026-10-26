import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { StatusDot } from '@reinforce/ui-react/status-dot';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Power } from 'lucide-react';
import { match } from 'ts-pattern';
import { agentOf } from '~/shared/api/mock/agents';
import { JOURNAL, type JournalEntry, type JournalState } from '~/shared/api/mock/wallet';
import { useT } from '~/shared/i18n';
import { dataColumnClass } from '~/shared/ui/page-column';
import { useAgentActions, useAllStopped } from '../api/agent-store';
import { AgentAvatar } from './agent-avatar';

const stateClass = (state: JournalState): string =>
  match(state)
    .with('done', 'auto', () => 'bg-up/12 text-up')
    .with('pending', () => 'bg-primary/12 text-primary')
    .with('blocked', () => 'bg-down/12 text-down')
    .exhaustive();

const DAYS = [...new Set(JOURNAL.map((entry) => entry.day))];

export function JournalPage() {
  const { t } = useT('shell');
  return (
    <div className={dataColumnClass}>
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="page">
          {t('agents.journal.title')}
        </Heading>
        <Text variant="muted" className="text-row">
          {t('agents.journal.lead')}
        </Text>
      </div>
      <KillSwitch />
      {DAYS.map((day) => (
        <section key={day} className={cn(sectionCardClass, 'pb-3')}>
          <Heading as="h2" size="section" className="pb-2 text-row">
            {day}
          </Heading>
          <ul className="flex flex-col">
            {JOURNAL.filter((entry) => entry.day === day).map((entry) => (
              <JournalRow key={`${entry.day}-${entry.time}`} entry={entry} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function KillSwitch() {
  const { t } = useT('shell');
  const stopped = useAllStopped();
  const { allStopped, allResumed } = useAgentActions();
  return (
    <section
      className={cn(
        sectionCardClass,
        'flex flex-col gap-4 pb-6 sm:flex-row sm:items-center',
        stopped && 'ring-2 ring-down/40 ring-inset',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-2 font-semibold text-foreground text-base">
          <StatusDot
            state={stopped ? 'failed' : 'working'}
            pulse={!stopped}
            label={stopped ? t('agents.journal.kill.off') : t('agents.journal.kill.on')}
          />
          {stopped ? t('agents.journal.kill.off') : t('agents.journal.kill.on')}
        </span>
        <p className="text-foreground-soft text-sm">
          {stopped ? t('agents.journal.kill.offNote') : t('agents.journal.kill.onNote')}
        </p>
      </div>
      <Button
        variant={stopped ? 'secondary' : 'destructive'}
        size="lg"
        onClick={stopped ? allResumed : allStopped}
        className="shrink-0"
      >
        <Power aria-hidden />
        {stopped ? t('agents.journal.kill.resume') : t('agents.journal.kill.stop')}
      </Button>
    </section>
  );
}

function JournalRow({ entry }: { readonly entry: JournalEntry }) {
  const { t } = useT('shell');
  const agent = agentOf(entry.agent);
  return (
    <li className="flex items-start gap-3 border-foreground/7 border-t py-3.5 first:border-t-0">
      <span className="w-11 shrink-0 pt-1 text-meta text-muted-foreground tabular-nums">{entry.time}</span>
      <AgentAvatar agent={agent} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium text-foreground text-sm">{entry.text}</span>
        <span className="text-meta text-muted-foreground">
          {agent.name} · {t('agents.journal.why')}: {entry.why}
        </span>
        {entry.tx && (
          <span className="font-mono text-[0.6875rem] text-muted-foreground">
            {t('agents.journal.tx')} {entry.tx}
          </span>
        )}
      </div>
      <span
        className={cn('shrink-0 rounded-full px-2 py-0.5 font-medium text-[0.6875rem]', stateClass(entry.state))}
      >
        {t(`agents.journal.state.${entry.state}`)}
      </span>
    </li>
  );
}
