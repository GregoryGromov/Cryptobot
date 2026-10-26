import type { ForecastNote, Why, WhyPoint } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Reveal } from '~/shared/ui/reveal';
import { stanceOf } from '../domain/episode-vm';
import { priceMove } from '../domain/mini-vm';
import { termsWords } from '../domain/verdict';
import { orderedPoints, type PointStance, pointKey } from '../domain/why-vm';
import { FigureView } from './figures/figure-view';
import { MiniFigure } from './figures/mini-figure';

const ENTER_STEP_MS = 40;

const stanceIcon = (stance: PointStance): { readonly icon: LucideIcon; readonly className: string } =>
  match(stance)
    .with('up', () => ({ icon: ArrowUpRight, className: 'text-up' }))
    .with('down', () => ({ icon: ArrowDownRight, className: 'text-down' }))
    .with('flat', () => ({ icon: ArrowRight, className: 'text-muted-foreground' }))
    .with('risk', () => ({ icon: TriangleAlert, className: 'text-warning' }))
    .exhaustive();

export function WhyPoints({
  forecast,
  why,
  onShow,
}: {
  readonly forecast: ForecastNote;
  readonly why: Why;
  readonly onShow: (row: string) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ul className="flex flex-col">
      {orderedPoints(why.points, stanceOf(forecast)).map(({ index, point }, place) => (
        <WhyPointItem
          key={index}
          id={pointKey(forecast.id, index)}
          point={point}
          place={place}
          terms={forecast.horizons.length > 1}
          open={open === index}
          onToggle={() => setOpen(open === index ? null : index)}
          onShow={onShow}
        />
      ))}
    </ul>
  );
}

function WhyPointItem({
  id,
  point,
  place,
  terms,
  open,
  onToggle,
  onShow,
}: {
  readonly id: string;
  readonly point: WhyPoint;
  readonly place: number;
  readonly terms: boolean;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly onShow: (row: string) => void;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const { icon: Icon, className } = stanceIcon(point.stance);
  const { row, figure } = point;
  const move = figure?.kind === 'price' ? priceMove(figure) : null;
  const aside = [
    t(`why.stance.${point.stance}`),
    terms && point.horizons.length > 0
      ? t('why.matters', { terms: termsWords(format, point.horizons, t('why.and')) })
      : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
  return (
    <li
      style={{ animationDelay: `${place * ENTER_STEP_MS}ms` }}
      className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 fill-mode-both motion-safe:animate-in motion-safe:duration-300"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="group focus-ring hover-neutral-soft -mx-2 grid w-[calc(100%+1rem)] grid-cols-[0.875rem_minmax(0,1fr)_auto] items-start gap-x-2.5 rounded-lg px-2 py-2.25 text-left transition-colors aria-expanded:bg-foreground/4 sm:items-center sm:gap-x-3"
      >
        <Icon aria-hidden className={cn('mt-0.75 size-3.5 sm:mt-0', className)} strokeWidth={2} />
        <span className="text-foreground-soft text-sm transition-colors group-aria-expanded:text-foreground">
          <span className="sr-only">{`${aside}. `}</span>
          {point.claim}
        </span>
        <span className="grid justify-items-end gap-y-0.5 sm:grid-cols-[5rem_3.75rem] sm:items-center sm:gap-x-3.5">
          <span
            data-shown={!open}
            className="transition-[opacity,scale] duration-200 ease-out data-[shown=false]:scale-90 data-[shown=false]:opacity-0 motion-reduce:transition-none"
          >
            {figure && <MiniFigure figure={figure} className="w-16 sm:w-20" />}
          </span>
          <span className="font-figure text-foreground text-sm">
            {point.value ?? (move === null ? null : fmt.change(move, 2))}
          </span>
        </span>
      </button>
      <Reveal open={open} id={id}>
        <div
          data-shown={open}
          className="motion-safe:fade-in motion-safe:slide-in-from-top-1 flex flex-col items-start gap-2 pt-2 pb-4 transition-[opacity,translate] duration-300 ease-out data-[shown=false]:-translate-y-1 data-[shown=false]:opacity-0 motion-safe:animate-in motion-safe:duration-300 motion-reduce:transition-none sm:ps-6.5"
        >
          {figure && <FigureView figure={figure} />}
          <p className="text-muted-foreground text-xs">{point.caption}</p>
          {row !== null && (
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0 has-[>svg]:px-0"
              onClick={() => onShow(row)}
            >
              {t('why.toData')}
            </Button>
          )}
        </div>
      </Reveal>
    </li>
  );
}
