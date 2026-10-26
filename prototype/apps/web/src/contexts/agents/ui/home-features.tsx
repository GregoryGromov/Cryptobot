import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Building2, Crown, Lock } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import { type AgentKey, agentOf } from '~/shared/api/mock/agents';
import { RWA_GROUPS, RWA_SHOWCASE, rwaAsset } from '~/shared/api/mock/rwa';
import { EXCHANGES, HEALTH, PROTOCOL_RISKS } from '~/shared/api/mock/wallet';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { useAgentStaked } from '../api/agent-store';
import { riskClass } from './agent-card';
import { AgentAvatar } from './agent-avatar';
import { PremiumBadge } from './premium-badge';

const GAUGE_FROM = 1;
const GAUGE_TO = 2;

const tileClass =
  'focus-ring flex h-full flex-col gap-3 rounded-(--radius-card) bg-foreground/4 p-4 transition-colors hover:bg-foreground/8 active:bg-foreground/10';

const valueClass = 'font-semibold text-2xl text-foreground tabular-nums leading-none';

const gaugeAt = (value: number): number =>
  Math.min(100, Math.max(0, ((value - GAUGE_FROM) / (GAUGE_TO - GAUGE_FROM)) * 100));

function TileHead({ agent, icon, title }: { readonly agent?: AgentKey; readonly icon?: ReactNode; readonly title: string }) {
  return (
    <span className="flex items-center gap-2.5">
      {agent ? <AgentAvatar agent={agentOf(agent)} size="sm" /> : icon}
      <span className="font-medium text-foreground text-row">{title}</span>
    </span>
  );
}

function TileFoot({ children }: { readonly children: ReactNode }) {
  return <span className="mt-auto text-meta text-muted-foreground">{children}</span>;
}

function HealthTile() {
  const { t } = useT('shell');
  const f = useFormatters();
  return (
    <Link {...topicLink(agentOf('guard').topic)} className={tileClass}>
      <TileHead agent="guard" title={t('agents.home.features.health.title')} />
      <span className="flex items-baseline gap-2">
        <span className={cn(valueClass, 'text-up')}>{f.decimal(HEALTH.value, 2)}</span>
        <span className="text-meta text-muted-foreground">{HEALTH.where}</span>
      </span>
      <span className="relative flex h-1.5 w-full gap-0.5">
        <span className="rounded-s-full bg-down/70" style={{ flexGrow: gaugeAt(HEALTH.danger) }} />
        <span className="bg-(--palette-amber-500)/80" style={{ flexGrow: gaugeAt(HEALTH.safe) - gaugeAt(HEALTH.danger) }} />
        <span className="rounded-e-full bg-up/70" style={{ flexGrow: 100 - gaugeAt(HEALTH.safe) }} />
        <span
          aria-hidden
          className="-translate-x-1/2 -top-1 absolute size-3.5 rounded-full border-2 border-background bg-foreground"
          style={{ left: `${gaugeAt(HEALTH.value)}%` }}
        />
      </span>
      <span className="text-meta text-foreground-soft">{HEALTH.liquidation}</span>
      <TileFoot>{t('agents.home.features.health.foot')}</TileFoot>
    </Link>
  );
}

function RiskTile() {
  const { t } = useT('shell');
  return (
    <Link {...topicLink(agentOf('analyst').topic)} className={tileClass}>
      <TileHead agent="analyst" title={t('agents.home.features.risk.title')} />
      <ul className="flex flex-col gap-1.5">
        {PROTOCOL_RISKS.map((protocol) => (
          <li key={protocol.name} className="flex items-center gap-2 text-sm">
            <span className="w-16 shrink-0 font-medium text-foreground">{protocol.name}</span>
            <span className="min-w-0 flex-1 truncate text-meta text-muted-foreground">{protocol.why}</span>
            <span className={cn('shrink-0 font-medium text-meta', riskClass(protocol.risk))}>
              {t(`agents.risk.${protocol.risk}`)}
            </span>
          </li>
        ))}
      </ul>
      <TileFoot>{t('agents.home.features.risk.foot')}</TileFoot>
    </Link>
  );
}

function CexTile() {
  const { t } = useT('shell');
  return (
    <Link {...topicLink(agentOf('treasurer').topic)} className={tileClass}>
      <TileHead agent="treasurer" title={t('agents.home.features.cex.title')} />
      <span className="flex items-baseline gap-2">
        <span className={valueClass}>{t('agents.home.features.cex.value')}</span>
        <span className="text-meta text-muted-foreground">{t('agents.home.features.cex.note')}</span>
      </span>
      <span className="flex flex-wrap gap-1.5">
        {EXCHANGES.map((exchange) => (
          <span
            key={exchange}
            className="rounded-full bg-foreground/6 px-2.5 py-0.5 font-medium text-foreground-soft text-meta"
          >
            {exchange}
          </span>
        ))}
      </span>
      <TileFoot>{t('agents.home.features.cex.foot')}</TileFoot>
    </Link>
  );
}

function ForceTile() {
  const { t } = useT('shell');
  const staked = useAgentStaked();
  return (
    <Link to="/rewards" className={tileClass}>
      <TileHead
        icon={
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--palette-violet-500)/15 text-(--palette-violet-500)">
            <Crown strokeWidth={2} className="size-3.5" />
          </span>
        }
        title={t('agents.home.features.force.title')}
      />
      <span className="flex items-center gap-2">
        {staked ? <PremiumBadge /> : <Lock strokeWidth={2} className="size-4 text-muted-foreground" />}
        <span className={cn(valueClass, 'text-xl', !staked && 'text-foreground-soft')}>
          {staked ? t('agents.home.features.force.active') : t('agents.home.features.force.inactive')}
        </span>
      </span>
      <span className="text-meta text-foreground-soft">{t('agents.home.features.force.note')}</span>
      <TileFoot>{t('agents.home.features.force.foot')}</TileFoot>
    </Link>
  );
}

function RwaTile() {
  const { t } = useT('shell');
  const f = useFormatters();
  return (
    <Link to="/rwa" className={tileClass}>
      <TileHead
        icon={
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--palette-amber-500)/16 text-(--palette-amber-600)">
            <Building2 strokeWidth={2} className="size-3.5" />
          </span>
        }
        title={t('agents.home.features.rwa.title')}
      />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {RWA_SHOWCASE.map((item) => {
          const asset = rwaAsset(item.ticker);
          if (!asset) return null;
          return (
            <li key={item.ticker} className="flex min-w-0 items-center gap-2.5">
              <img src={item.logo} alt="" className="size-9 shrink-0 rounded-full object-cover" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-foreground text-sm">{item.label}</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-meta text-foreground-soft tabular-nums">{asset.price}</span>
                  {asset.change !== null && (
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        directionOf(asset.change, 1) === 'down' ? 'text-down' : 'text-up',
                      )}
                    >
                      {f.change(asset.change, 1)}
                    </span>
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <span className="flex flex-wrap gap-x-4 gap-y-1 text-meta">
        {RWA_GROUPS.flatMap((group) => group.assets)
          .filter((asset) => asset.yield !== null)
          .map((asset) => (
            <span key={asset.ticker} className="text-foreground-soft">
              {asset.name} · <span className="font-medium text-up">{asset.yield}</span>{' '}
              {t('agents.home.features.rwa.yield')}
            </span>
          ))}
      </span>
      <TileFoot>{t('agents.home.features.rwa.foot')}</TileFoot>
    </Link>
  );
}

export function HomeFeatures() {
  const { t } = useT('shell');
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="flex flex-col">
      <Heading as="h2" size="section" id={heading} className="px-1 pb-2 text-row">
        {t('agents.home.features.label')}
      </Heading>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li className="sm:col-span-2">
          <RwaTile />
        </li>
        <li>
          <HealthTile />
        </li>
        <li>
          <RiskTile />
        </li>
        <li>
          <CexTile />
        </li>
        <li>
          <ForceTile />
        </li>
      </ul>
    </section>
  );
}
