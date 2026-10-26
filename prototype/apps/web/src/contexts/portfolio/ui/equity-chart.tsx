import { Tabs, TabsContent, TabsList, TabsTrigger } from '@reinforce/ui-react/tabs';
import { cn } from '@reinforce/ui-styles/cn';
import { useNavigate } from '@tanstack/react-router';
import { useId } from 'react';
import { useT } from '~/shared/i18n';
import type { BookView } from '../domain/book-vm';
import { PERIODS, type Period } from '../domain/equity';
import { PANEL_CLASS, PANEL_HEAD_CLASS, PANEL_TITLE_CLASS } from './book-facts';
import { EquityPlot } from './equity-plot';

const isPeriod = (value: string): value is Period => PERIODS.some((period) => period === value);

export function EquityChart({
  view,
  period,
  className,
}: {
  readonly view: BookView;
  readonly period: Period;
  readonly className?: string;
}) {
  const { t } = useT('portfolio');
  const navigate = useNavigate({ from: '/portfolio' });
  const id = useId();
  const choose = (value: string) => {
    if (!isPeriod(value)) return;
    void navigate({
      search: (prev) => ({ ...prev, period: value === 'all' ? undefined : value }),
      replace: true,
      resetScroll: false,
    });
  };
  return (
    <section aria-labelledby={id} className={cn(PANEL_CLASS, className)}>
      <Tabs value={period} onValueChange={choose} className="flex-1 gap-2">
        <div className={PANEL_HEAD_CLASS}>
          <h2 id={id} className={PANEL_TITLE_CLASS}>
            {t('chart.title')}
          </h2>
          <TabsList aria-label={t('chart.period')}>
            {PERIODS.map((p) => (
              <TabsTrigger key={p} value={p} size="sm" className="font-figure">
                {t(`chart.periods.${p}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {PERIODS.map((p) =>
          p === period ? (
            <EquityPlot key={p} value={p} view={view} />
          ) : (
            <TabsContent key={p} value={p} forceMount hidden />
          ),
        )}
      </Tabs>
    </section>
  );
}
