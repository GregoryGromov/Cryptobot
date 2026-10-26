import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { toast } from '@reinforce/ui-react/sonner';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { HOLDINGS, TEMPLATES, type Template } from '~/shared/api/mock/wallet';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { dataColumnClass } from '~/shared/ui/page-column';
import { riskClass } from './agent-card';
import { Slices, tintDotClass } from './slices';

const DAY_CHANGE = 0.68;

const ACTIVE_TEMPLATE: Template['key'] = 'conservative';

export function WealthPortfolioPage() {
  const { t } = useT('shell');
  const f = useFormatters();
  const total = HOLDINGS.reduce((sum, holding) => sum + holding.usd, 0);
  return (
    <div className={dataColumnClass}>
      <Heading as="h1" size="page">
        {t('agents.portfolio.title')}
      </Heading>

      <section className={cn(sectionCardClass, 'flex flex-col gap-5 pb-6')}>
        <div className="flex flex-col gap-1">
          <span className="text-meta text-muted-foreground">{t('agents.portfolio.total')}</span>
          <span className="flex items-baseline gap-3">
            <span className="font-semibold text-3xl text-foreground tabular-nums">{f.usd(total)}</span>
            <span className="text-sm text-up tabular-nums">
              {f.change(DAY_CHANGE, 2)} {t('agents.portfolio.day')}
            </span>
          </span>
        </div>
        <Slices
          legend={false}
          slices={HOLDINGS.map((holding) => ({
            label: holding.asset,
            share: Math.round((holding.usd / total) * 100),
            tint: holding.tint,
          }))}
        />
        <ul className="flex flex-col">
          {HOLDINGS.map((holding) => (
            <li
              key={holding.asset}
              className="flex items-center gap-3 border-foreground/7 border-t py-3 first:border-t-0 first:pt-0"
            >
              <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', tintDotClass[holding.tint])} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium text-foreground text-sm">{holding.asset}</span>
                <span className="text-meta text-muted-foreground">{holding.amount}</span>
              </span>
              {holding.earns && (
                <span className="rounded-full bg-up/12 px-2 py-0.5 font-medium text-[0.6875rem] text-up">
                  {holding.earns}
                </span>
              )}
              <span className="flex w-28 flex-col items-end">
                <span className="font-medium text-foreground text-sm tabular-nums">{f.usd(holding.usd)}</span>
                <span className="text-meta text-muted-foreground tabular-nums">
                  {Math.round((holding.usd / total) * 100)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 flex flex-col gap-1">
        <Heading as="h2" size="section">
          {t('agents.portfolio.templates')}
        </Heading>
        <Text variant="muted" className="text-sm">
          {t('agents.portfolio.templatesLead')}
        </Text>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TEMPLATES.map((template) => (
          <TemplateCard key={template.key} template={template} active={template.key === ACTIVE_TEMPLATE} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, active }: { readonly template: Template; readonly active: boolean }) {
  const { t } = useT('shell');
  return (
    <section
      className={cn(
        sectionCardClass,
        'flex flex-col gap-4 pb-5',
        active && 'ring-2 ring-primary/50 ring-inset',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Heading as="h3" size="section" className="text-base">
          {template.name}
        </Heading>
        {active && (
          <span className="rounded-full bg-primary/12 px-2 py-0.5 font-medium text-[0.6875rem] text-primary">
            {t('agents.portfolio.active')}
          </span>
        )}
      </div>
      <p className="text-foreground-soft text-sm">{template.about}</p>
      <Slices slices={template.slices} />
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t('agents.portfolio.yield')}</dt>
          <dd className="font-medium text-foreground tabular-nums">{template.yield}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t('agents.portfolio.drawdown')}</dt>
          <dd className="font-medium text-foreground tabular-nums">{template.drawdown}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{t('agents.card.risk')}</dt>
          <dd className={cn('font-medium', riskClass(template.risk))}>{t(`agents.risk.${template.risk}`)}</dd>
        </div>
      </dl>
      {!active && (
        <Button variant="secondary" size="sm" className="mt-auto" onClick={() => toast(t('agents.portfolio.applied'))}>
          {t('agents.portfolio.apply')}
        </Button>
      )}
    </section>
  );
}
