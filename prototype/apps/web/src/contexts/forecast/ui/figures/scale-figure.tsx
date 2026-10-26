import type { Scale } from '@reinforce/server/dto';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { scaleDigits } from '../../domain/figure-vm';
import { Track } from './track';

export function ScaleFigure({ scale, width }: { readonly scale: Scale; readonly width: number }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const digits = scaleDigits(scale);
  return (
    <div className="flex flex-col gap-1">
      <Track scale={scale} width={width} labelled />
      <div className="flex justify-between gap-3 text-muted-foreground text-xs">
        <span>{scale.ends?.[0]}</span>
        {scale.range && (
          <span className="font-figure">
            {t('figure.hourRange', {
              lo: fmt.decimal(scale.range[0], digits),
              hi: fmt.decimal(scale.range[1], digits),
            })}
          </span>
        )}
        <span className="text-end">{scale.ends?.[1]}</span>
      </div>
    </div>
  );
}

export const scaleTrailWords = (scale: Scale, decimal: (value: number, digits: number) => string): string =>
  scale.trail.map((p) => `${p.label} ${decimal(p.value, scaleDigits(scale))}`).join(' → ');
