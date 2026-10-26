import type { ForecastNote, Horizon } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { ArrowDownRight, ArrowUpRight, Check, type LucideIcon, Minus, X } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Reveal } from '~/shared/ui/reveal';
import { type HorizonStatus, type StripCell, stripOf } from '../domain/episode-vm';
import { horizonWords, type Lean } from '../domain/verdict';
import { HorizonDetails } from './horizon-details';

const leanIcon = (lean: Lean): { readonly icon: LucideIcon; readonly className: string } =>
  match(lean?.cls ?? null)
    .with('UP', () => ({ icon: ArrowUpRight, className: 'text-up' }))
    .with('DOWN', () => ({ icon: ArrowDownRight, className: 'text-down' }))
    .with('FLAT', null, () => ({ icon: Minus, className: 'text-foreground' }))
    .exhaustive();

const chipClass =
  'focus-ring hover-neutral-soft inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-foreground/14 px-3 text-meta transition-colors aria-checked:border-foreground/26 aria-checked:bg-foreground/8';

export function HorizonStrip({
  forecast,
  now,
  aside,
}: {
  readonly forecast: ForecastNote;
  readonly now: number;
  readonly aside?: ReactNode;
}) {
  const { t } = useT('forecast');
  const detailsId = useId();
  const [picked, setPicked] = useState<Horizon | null>(null);
  const [shown, setShown] = useState<Horizon | null>(null);
  const cells = stripOf(forecast, now);
  const pick = (horizon: Horizon) => {
    if (picked === horizon) {
      setPicked(null);
      return;
    }
    setPicked(horizon);
    setShown(horizon);
  };
  const note = forecast.horizons.find((h) => h.horizon === shown) ?? null;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="radiogroup" aria-label={t('strip.label')} className="flex flex-wrap items-center gap-2">
          {cells.map((cell) => (
            // biome-ignore lint/a11y/useSemanticElements: a horizon is a chip to press that folds its details open, not a form radio.
            <button
              key={cell.horizon}
              type="button"
              role="radio"
              aria-checked={picked === cell.horizon}
              aria-controls={detailsId}
              onClick={() => pick(cell.horizon)}
              className={chipClass}
            >
              <ChipBody cell={cell} />
            </button>
          ))}
        </div>
        {aside && <span className="ms-auto">{aside}</span>}
      </div>
      <Reveal open={picked !== null} id={detailsId}>
        {note && <HorizonDetails forecast={forecast} horizon={note} now={now} />}
      </Reveal>
    </div>
  );
}

function ChipBody({ cell }: { readonly cell: StripCell }) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const { icon: Icon, className } = leanIcon(cell.lean);
  return (
    <>
      <span className="text-muted-foreground">{horizonWords(format, cell.horizon)}</span>
      <Icon aria-hidden strokeWidth={2} className={cn('size-3.5', className)} />
      <span className="sr-only">{cell.lean ? t(`lean.${cell.lean.cls}`) : t('lean.none')}</span>
      <span className="font-figure text-foreground">
        {cell.lean ? t('lean.tenths', { n: cell.lean.tenths }) : t('lean.tied', { n: cell.top })}
      </span>
      <StatusMark status={cell.status} />
    </>
  );
}

function StatusMark({ status }: { readonly status: HorizonStatus }) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const quiet = (words: string) => <span className="sr-only">{words}</span>;
  return match(status)
    .with({ kind: 'waiting' }, (s) => quiet(t('strip.at', { time: fmt.clock(s.at) })))
    .with({ kind: 'checking' }, () => quiet(t('strip.checking')))
    .with({ kind: 'no-prices' }, () => quiet(t('strip.noPrices')))
    .with({ kind: 'unscored' }, () => quiet(t('strip.unscored')))
    .with({ kind: 'checked', mark: 'hit' }, () => (
      <>
        <Check aria-hidden className="size-3.5 text-foreground" strokeWidth={2.25} />
        {quiet(t('strip.hit'))}
      </>
    ))
    .with({ kind: 'checked', mark: 'miss' }, () => (
      <>
        <X aria-hidden className="size-3.5 text-muted-foreground" strokeWidth={2} />
        {quiet(t('strip.miss'))}
      </>
    ))
    .with({ kind: 'checked', mark: 'flat' }, () => quiet(t('strip.flat')))
    .with({ kind: 'checked', mark: 'none' }, () => quiet(t('strip.none')))
    .exhaustive();
}
