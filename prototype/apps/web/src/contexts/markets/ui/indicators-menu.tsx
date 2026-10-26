import { Button } from '@reinforce/ui-react/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@reinforce/ui-react/dropdown-menu';
import { cn } from '@reinforce/ui-styles/cn';
import { Activity, Check } from 'lucide-react';
import { useT } from '~/shared/i18n';
import { INDICATORS, type Indicator } from '../domain/indicators';
import { INDICATOR_SWATCH_CLASSES } from './chart-palette';
import { useIndicators } from './use-indicators';

/** The indicators a market's chart draws, ticked in a menu; closed while the chart compares markets. */
export function IndicatorsMenu({
  unavailable,
  comparing,
  className,
}: {
  /** Indicators the frame shown cannot draw. */
  readonly unavailable: readonly Indicator[];
  readonly comparing: boolean;
  readonly className?: string;
}) {
  const { t } = useT('markets');
  const [shown, toggle] = useIndicators();
  const count = shown.filter((indicator) => !unavailable.includes(indicator)).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={comparing}>
        <Button
          variant="ghost"
          size="sm"
          title={comparing ? t('chart.indicators.comparing') : undefined}
          className={cn('text-muted-foreground', className)}
        >
          <Activity aria-hidden />
          <span className="max-sm:sr-only">{t('chart.indicators.title')}</span>
          {count > 0 && !comparing && (
            <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-foreground/12 px-1 font-figure font-semibold text-[0.6875rem] text-foreground">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {INDICATORS.map((indicator) => {
          const on = shown.includes(indicator);
          const off = unavailable.includes(indicator);
          return (
            <DropdownMenuItem
              key={indicator}
              role="menuitemcheckbox"
              aria-checked={on}
              disabled={off}
              onSelect={(event) => {
                event.preventDefault();
                toggle(indicator);
              }}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-[0.3rem] border',
                  on ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground',
                )}
              >
                {on && <Check strokeWidth={3} className="size-3" />}
              </span>
              <span
                aria-hidden
                className={cn('h-0.5 w-3 shrink-0 rounded-full', INDICATOR_SWATCH_CLASSES[indicator])}
              />
              <span className="min-w-0 flex-1 text-foreground">{t(`chart.indicators.${indicator}`)}</span>
              {off && (
                <span className="text-muted-foreground text-xs">{t('chart.indicators.shortFrames')}</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
