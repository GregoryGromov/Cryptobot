import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Check, Crown, Gem } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  BASE_PERKS,
  EARNINGS,
  FORCE_BALANCE,
  FORCE_STAKE,
  POINTS,
  PREMIUM_PERKS,
} from '~/shared/api/mock/wallet';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { dataColumnClass } from '~/shared/ui/page-column';
import { useAgentActions, useAgentStaked } from '../api/agent-store';
import { PremiumBadge } from './premium-badge';

const currentChipClass = 'rounded-full bg-primary/12 px-2 py-0.5 font-medium text-[0.6875rem] text-primary';

export function RewardsPage() {
  const { t } = useT('shell');
  const f = useFormatters();
  const staked = useAgentStaked();
  return (
    <div className={dataColumnClass}>
      <Heading as="h1" size="page">
        {t('agents.rewards.title')}
      </Heading>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <section className={cn(sectionCardClass, 'flex flex-col gap-5 pb-6')}>
          <div className="flex flex-col gap-1">
            <span className="text-meta text-muted-foreground">{t('agents.rewards.points')}</span>
            <span className="flex items-baseline gap-2">
              <Gem strokeWidth={2} className="size-5 self-center text-(--palette-violet-500)" />
              <span className="font-semibold text-3xl text-foreground tabular-nums">{f.int(POINTS)}</span>
              {staked && <span className="font-medium text-sm text-up">×1,5</span>}
            </span>
            <span className="text-meta text-muted-foreground">{t('agents.rewards.season')}</span>
          </div>
          <div className="flex flex-col gap-2">
            <Heading as="h2" size="section" className="text-row">
              {t('agents.rewards.earn')}
            </Heading>
            <ul className="flex flex-col">
              {EARNINGS.map((earn) => (
                <li
                  key={earn.title}
                  className="flex items-center justify-between gap-3 border-foreground/7 border-t py-2.5 text-sm first:border-t-0"
                >
                  <span className="text-foreground">{earn.title}</span>
                  <span className="text-right font-medium text-foreground-soft">{earn.reward}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <PremiumPass />
      </div>
    </div>
  );
}

function PremiumPass() {
  const { t } = useT('shell');
  const f = useFormatters();
  const staked = useAgentStaked();
  const { stakeToggled } = useAgentActions();
  return (
    <section
      className={cn(
        sectionCardClass,
        'relative flex flex-col gap-5 overflow-hidden pb-6',
        staked && 'ring-2 ring-(--palette-violet-500)/45 ring-inset',
      )}
    >
      <span
        aria-hidden
        className="-top-24 -end-24 pointer-events-none absolute size-64 rounded-full bg-(--palette-violet-500)/15 blur-3xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-md flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <Heading as="h2" size="section" className="text-xl">
              {t('agents.rewards.premium')}
            </Heading>
            {staked && <PremiumBadge />}
          </span>
          <Text variant="muted" className="text-sm">
            {t('agents.rewards.premiumLead')}
          </Text>
        </div>
        <dl className="flex gap-6 text-sm">
          <div className="flex flex-col">
            <dt className="text-meta text-muted-foreground">{t('agents.rewards.balance')}</dt>
            <dd className="font-semibold text-foreground tabular-nums">
              {f.int(staked ? FORCE_BALANCE - FORCE_STAKE : FORCE_BALANCE)} FORCE
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-meta text-muted-foreground">{t('agents.rewards.staked')}</dt>
            <dd className="font-semibold text-foreground tabular-nums">{f.int(staked ? FORCE_STAKE : 0)} FORCE</dd>
          </div>
        </dl>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <div
          className={cn(
            'surface-inset flex flex-col gap-3 rounded-md px-4 py-3.5',
            !staked && 'ring-2 ring-primary/40 ring-inset',
          )}
        >
          <PlanHead name={t('agents.rewards.base')} price={t('agents.rewards.free')} current={!staked} />
          <Perks perks={BASE_PERKS} />
        </div>
        <div
          className={cn(
            'flex flex-col gap-3 rounded-md bg-linear-to-br from-(--palette-violet-500)/16 to-(--palette-blue-500)/10 px-4 py-3.5 ring-1 ring-(--palette-violet-500)/30 ring-inset',
            staked && 'ring-2 ring-(--palette-violet-500)/60',
          )}
        >
          <PlanHead
            name={t('agents.rewards.premium')}
            price={t('agents.rewards.price')}
            current={staked}
            icon={<Crown strokeWidth={2.2} className="size-4 text-(--palette-violet-500)" />}
          />
          <Perks perks={PREMIUM_PERKS} columns />
        </div>
      </div>

      <Button
        variant={staked ? 'secondary' : 'default'}
        onClick={stakeToggled}
        className="relative self-start"
      >
        {!staked && <Crown aria-hidden />}
        {staked ? t('agents.rewards.unstake') : t('agents.rewards.stakeAction')}
      </Button>
    </section>
  );
}

function PlanHead({
  name,
  price,
  current,
  icon,
}: {
  readonly name: string;
  readonly price: string;
  readonly current: boolean;
  readonly icon?: ReactNode;
}) {
  const { t } = useT('shell');
  return (
    <div className="flex flex-col">
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
          {icon}
          {name}
        </span>
        {current && <span className={currentChipClass}>{t('agents.rewards.current')}</span>}
      </span>
      <span className="text-meta text-muted-foreground">{price}</span>
    </div>
  );
}

function Perks({ perks, columns = false }: { readonly perks: readonly string[]; readonly columns?: boolean }) {
  return (
    <ul className={cn('grid gap-1.5', columns && 'sm:grid-cols-2 sm:gap-x-4')}>
      {perks.map((perk) => (
        <li key={perk} className="flex items-start gap-1.5 text-meta">
          <Check strokeWidth={2.4} className="mt-0.5 size-3 shrink-0 text-up" />
          <span className="text-foreground-soft">{perk}</span>
        </li>
      ))}
    </ul>
  );
}
