import { Card } from '@reinforce/ui-react/card';
import { cn } from '@reinforce/ui-styles/cn';
import {
  ArrowLeftRight,
  BellRing,
  Check,
  CircleDot,
  Circle,
  FileWarning,
  Landmark,
  type LucideIcon,
  PieChart,
  Send,
  ShieldCheck,
  Sprout,
  X,
} from 'lucide-react';
import { match } from 'ts-pattern';
import type { AgentCard, CardKind, CardStatus, Risk } from '~/shared/api/mock/cards';
import { useT } from '~/shared/i18n';
import { Slices } from './slices';

const KIND_ICON: Record<CardKind, LucideIcon> = {
  swap: ArrowLeftRight,
  transfer: Send,
  contract: FileWarning,
  alert: BellRing,
  withdraw: Landmark,
  portfolio: PieChart,
  yields: Sprout,
};

const statusClass = (status: CardStatus): string =>
  match(status)
    .with('pending', () => 'bg-primary/12 text-primary')
    .with('done', 'auto', 'safe', () => 'bg-up/12 text-up')
    .with('danger', () => 'bg-down/12 text-down')
    .exhaustive();

export const riskClass = (risk: Risk): string =>
  match(risk)
    .with('low', () => 'text-up')
    .with('mid', () => 'text-(--palette-amber-500)')
    .with('high', () => 'text-down')
    .exhaustive();

const tagClass = 'rounded-full bg-foreground/6 px-2 py-0.5 font-medium text-[0.6875rem] text-foreground-soft';

export function AgentCardView({ card }: { readonly card: AgentCard }) {
  const { t } = useT('shell');
  const Icon = KIND_ICON[card.kind];
  return (
    <Card size="sm" className="w-full max-w-[34rem] gap-3.5 px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/6 text-foreground-soft">
          <Icon strokeWidth={1.9} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-foreground-soft text-sm">{card.title}</span>
        {card.status && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 font-medium text-[0.6875rem]',
              statusClass(card.status),
            )}
          >
            {t(`agents.card.status.${card.status}`)}
          </span>
        )}
      </div>

      {card.headline && <p className="font-semibold text-foreground text-xl tabular-nums">{card.headline}</p>}

      {card.slices && <Slices slices={card.slices} />}

      {card.rows && (
        <dl className="flex flex-col gap-2">
          {card.rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <dt className="w-32 shrink-0 text-muted-foreground">{row.label}</dt>
              <dd className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-foreground">
                <span>{row.value}</span>
                {row.tag && <span className={tagClass}>{row.tag}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {card.yields && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-meta text-muted-foreground">
              <th className="pb-2 font-normal">{t('agents.card.where')}</th>
              <th className="pb-2 text-right font-normal">{t('agents.card.apy')}</th>
              <th className="pb-2 text-right font-normal">{t('agents.card.risk')}</th>
            </tr>
          </thead>
          <tbody>
            {card.yields.map((row) => (
              <tr key={row.name} className="border-foreground/7 border-t">
                <td className="py-2 text-foreground">{row.name}</td>
                <td className="py-2 text-right font-medium text-foreground tabular-nums">{row.apy}</td>
                <td className={cn('py-2 text-right', riskClass(row.risk))}>{t(`agents.risk.${row.risk}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {card.checks && (
        <div className="surface-inset flex flex-col gap-2 rounded-md px-3.5 py-3">
          <span className="flex items-center gap-1.5 font-medium text-meta text-muted-foreground">
            <ShieldCheck strokeWidth={1.9} className="size-3.5 text-(--palette-blue-500)" />
            {t('agents.card.checked')}
          </span>
          <ul className="flex flex-col gap-1.5">
            {card.checks.map((check) => (
              <li key={check.text} className="flex items-start gap-2 text-sm">
                {check.ok ? (
                  <Check strokeWidth={2.4} className="mt-0.5 size-3.5 shrink-0 text-up" />
                ) : (
                  <X strokeWidth={2.4} className="mt-0.5 size-3.5 shrink-0 text-down" />
                )}
                <span className="text-foreground">{check.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.steps && (
        <ol className="flex flex-col gap-2">
          {card.steps.map((step) => {
            const StepIcon = match(step.state)
              .with('done', () => Check)
              .with('now', () => CircleDot)
              .with('next', () => Circle)
              .exhaustive();
            return (
              <li key={step.text} className="flex items-start gap-2 text-sm">
                <StepIcon
                  strokeWidth={2.2}
                  className={cn(
                    'mt-0.5 size-3.5 shrink-0',
                    step.state === 'done' && 'text-up',
                    step.state === 'now' && 'text-primary',
                    step.state === 'next' && 'text-muted-foreground',
                  )}
                />
                <span className={step.state === 'next' ? 'text-muted-foreground' : 'text-foreground'}>
                  {step.text}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
