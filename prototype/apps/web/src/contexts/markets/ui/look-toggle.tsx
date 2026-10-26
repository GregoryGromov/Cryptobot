import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { ChartCandlestick, ChartLine } from 'lucide-react';
import { useT } from '~/shared/i18n';
import { type ChartLook, useChartLook } from './use-chart-dock';

const LOOKS: readonly ChartLook[] = ['candles', 'line'];

/** Candles or a line: one choice for every chart on the device. */
export function LookToggle({ className }: { readonly className?: string }) {
  const { t } = useT('markets');
  const [look, setLook] = useChartLook();
  return (
    <ToggleGroup
      type="single"
      aria-label={t('chart.look.label')}
      className={className}
      value={look}
      onValueChange={(value) => {
        const next = LOOKS.find((l) => l === value);
        if (next) setLook(next);
      }}
    >
      <ToggleGroupItem
        value="candles"
        size="sm"
        aria-label={t('chart.look.candles')}
        title={t('chart.look.candles')}
      >
        <ChartCandlestick aria-hidden />
      </ToggleGroupItem>
      <ToggleGroupItem value="line" size="sm" aria-label={t('chart.look.line')} title={t('chart.look.line')}>
        <ChartLine aria-hidden />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
