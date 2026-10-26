import { insetPanelClass } from '@reinforce/ui-primitives/inset-panel';
import { sheetBarClass, sheetBarTitleClass } from '@reinforce/ui-primitives/sheet';
import { Button } from '@reinforce/ui-react/button';
import { StatusDot } from '@reinforce/ui-react/status-dot';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Clock3, Lock, PauseCircle, Power } from 'lucide-react';
import { useId } from 'react';
import { type Agent, TRUST_LEVELS, type Trust } from '~/shared/api/mock/agents';
import { useT } from '~/shared/i18n';
import { useAgentActions, useAgentStaked, useAgentStopped, useAgentTrust } from '../api/agent-store';
import { AgentAvatar } from './agent-avatar';

const dockClass =
  'glass-island glass-lift motion-safe:fade-in sticky top-[max(1rem,env(safe-area-inset-top))] z-30 mt-[max(1rem,env(safe-area-inset-top))] me-[max(1rem,env(safe-area-inset-right))] mb-[max(1rem,env(safe-area-inset-bottom))] flex h-[calc(100svh-max(1rem,env(safe-area-inset-top))-max(1rem,env(safe-area-inset-bottom)))] w-80 shrink-0 flex-col self-start overflow-hidden rounded-(--radius-stage) motion-safe:animate-in motion-safe:duration-200';

export const agentDockRoomClass = '[--thread-dock:calc(20rem+max(1rem,env(safe-area-inset-right)))]';

const headingClass = 'mb-2.5 font-medium text-muted-foreground text-xs';

type FixedAgent = 'coordinator' | 'guard' | 'analyst';

const isFixed = (key: Agent['key']): key is FixedAgent =>
  key === 'coordinator' || key === 'guard' || key === 'analyst';

export function AgentDock({ agent }: { readonly agent: Agent }) {
  const { t } = useT('shell');
  const titleId = useId();
  const stopped = useAgentStopped(agent.key);
  const chosen = useAgentTrust(agent.key);
  const staked = useAgentStaked();
  const { stopToggled, trustChosen } = useAgentActions();
  const trust = chosen ?? agent.trust;
  return (
    <aside aria-labelledby={titleId} className={dockClass}>
      <div className={sheetBarClass}>
        <AgentAvatar agent={agent} size="sm" />
        <h2 id={titleId} className={sheetBarTitleClass}>
          {agent.name}
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4 pb-5">
        <div className={cn(insetPanelClass, 'flex flex-col gap-1.5 px-4 py-3.5')}>
          <span className="flex items-center gap-2 text-meta text-muted-foreground">
            <StatusDot
              state={stopped ? 'failed' : 'working'}
              pulse={!stopped}
              label={stopped ? t('agents.stopped') : t('agents.onDuty')}
            />
            {stopped ? t('agents.stopped') : t('agents.onDuty')}
          </span>
          <p className="text-foreground text-row">{stopped ? t('agents.stoppedNote') : agent.duty}</p>
        </div>

        <p className="text-foreground-soft text-sm">{agent.about}</p>

        <section>
          <h3 className={headingClass}>{t('agents.trust')}</h3>
          {trust ? (
            <ToggleGroup
              type="single"
              value={trust}
              disabled={stopped}
              aria-label={t('agents.trust')}
              onValueChange={(value) => {
                if (value) trustChosen(agent.key, value as Trust);
              }}
            >
              {TRUST_LEVELS.map((level) => (
                <ToggleGroupItem key={level} value={level} size="sm" disabled={level === 'transfer' && !staked}>
                  {level === 'transfer' && !staked && <Lock aria-hidden className="size-3" />}
                  {t(`agents.level.${level}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : (
            isFixed(agent.key) && <p className="text-foreground-soft text-sm">{t(`agents.fixed.${agent.key}`)}</p>
          )}
          {trust && !staked && (
            <Link
              to="/rewards"
              className="focus-ring mt-2.5 flex items-center gap-1.5 rounded-sm text-meta text-primary hover:underline"
            >
              <Lock aria-hidden className="size-3" />
              {t('agents.lockedTransfer')}
            </Link>
          )}
          {agent.limit && (
            <p className="mt-2.5 text-meta text-muted-foreground">
              {t('agents.limit')}: {agent.limit}
            </p>
          )}
        </section>

        <section>
          <h3 className={headingClass}>{t('agents.routines')}</h3>
          <ul className="flex flex-col gap-3.5">
            {agent.routines.map((routine) => {
              const Icon = routine.paused || stopped ? PauseCircle : Clock3;
              return (
                <li key={routine.title} className="flex items-start gap-3">
                  <Icon strokeWidth={1.75} className="mt-0.5 size-4.5 shrink-0 text-foreground-soft" />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-foreground text-sm">{routine.title}</span>
                    <span className="text-meta text-muted-foreground">
                      {routine.paused || stopped ? t('agents.paused') : routine.when}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="shrink-0 border-foreground/7 border-t p-3">
        <Button
          variant={stopped ? 'secondary' : 'ghost-destructive'}
          size="sm"
          className="w-full"
          onClick={() => stopToggled(agent.key)}
        >
          <Power aria-hidden />
          {stopped ? t('agents.resume') : t('agents.stop')}
        </Button>
      </div>
    </aside>
  );
}
