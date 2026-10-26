import type { ForecastNote, Inputs, MarketName, Why, WhyPoint } from '@reinforce/server/dto';
import { disclosureChevronClass } from '@reinforce/ui-primitives/collapsible';
import { Button } from '@reinforce/ui-react/button';
import { SkeletonLines } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { ChevronDown, Layers } from 'lucide-react';
import { useId, useState } from 'react';
import { match, P } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useLocale, useT } from '~/shared/i18n';
import { inSentence } from '~/shared/i18n/in-sentence';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { Reveal } from '~/shared/ui/reveal';
import { useForecastInputs, useForecastWhy } from '../api/queries';
import { stanceOf } from '../domain/episode-vm';
import { priceMove } from '../domain/mini-vm';
import { orderedPoints, type PointStance, pointKey } from '../domain/why-vm';
import { AllData, type DataNav } from './all-data';
import { FigureView } from './figures/figure-view';
import { MiniFigure } from './figures/mini-figure';

const ENTER_STEP_MS = 40;

const nodeClass = (stance: PointStance): string =>
  match(stance)
    .with('up', () => 'bg-up ring-up/20')
    .with('down', () => 'bg-down ring-down/20')
    .with('flat', () => 'bg-muted-foreground ring-muted-foreground/20')
    .with('risk', () => 'bg-warning ring-warning/20')
    .exhaustive();

const indicatorsOf = (inputs: Inputs): number => inputs.groups.reduce((sum, g) => sum + g.rows.length, 0);

/** What the broker went through before his verdict: one line with the counts, his points under it, all the data last. */
export function WorkLog({
  forecast,
  market,
  crossed,
  open,
  onToggle,
  active,
}: {
  readonly forecast: ForecastNote;
  readonly market: MarketName;
  readonly crossed: boolean;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly active: boolean;
}) {
  const { t } = useT('forecast');
  const id = useId();
  const inputs = useForecastInputs(forecast.id, active);
  const [data, setData] = useState(false);
  const [nav, setNav] = useState<DataNav>({ tab: null, focus: null, jump: 0 });
  const showInData = (row: string) => {
    setNav({ tab: null, focus: row, jump: nav.jump + 1 });
    setData(true);
  };
  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-log`}
        onClick={onToggle}
        className="group focus-ring -mx-1.5 flex items-center gap-2 self-start rounded-lg px-1.5 py-1 text-left text-meta text-muted-foreground transition-colors hover:text-foreground-soft"
      >
        <Layers aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
        <span className="min-w-0">
          {inputs.data ? <Studied inputs={inputs.data} /> : t('signal.log.label')}
        </span>
        <ChevronDown aria-hidden className={cn('size-3.5 shrink-0', disclosureChevronClass)} />
      </button>
      <Reveal open={open} id={`${id}-log`}>
        <div className="flex flex-col gap-2 pt-1.5">
          <AppBoundary tier="panel" scope="forecast-log">
            <LogPoints forecast={forecast} open={open} onShow={showInData} />
          </AppBoundary>
          <Change forecast={forecast} market={market} crossed={crossed} />
          {data && (
            <Button
              variant="link"
              size="sm"
              aria-expanded
              aria-controls={`${id}-data`}
              onClick={() => setData(false)}
              className="h-auto self-start ps-10 has-[>svg]:ps-10"
            >
              {t('signal.log.less')}
            </Button>
          )}
        </div>
      </Reveal>
      <Reveal open={open && data} id={`${id}-data`}>
        <div className="pt-1.5">
          <AppBoundary tier="panel" scope="forecast-data">
            <AllData
              forecast={forecast}
              nav={nav}
              onOpen={(tab) => setNav({ tab, focus: tab === null ? null : nav.focus, jump: nav.jump })}
            />
          </AppBoundary>
        </div>
      </Reveal>
    </div>
  );
}

function Studied({ inputs }: { readonly inputs: Inputs }) {
  const { t } = useT('forecast');
  const b = <b className="font-medium text-foreground-soft" />;
  const minutes = t('signal.log.minutes', { count: inputs.quality.bars });
  const indicators = t('signal.log.indicators', { count: indicatorsOf(inputs) });
  return match({ count: indicatorsOf(inputs), markets: inputs.markets })
    .with({ count: 0 }, () => (
      <Trans t={t} i18nKey="signal.log.minutesOnly" values={{ minutes }} components={{ b }} />
    ))
    .with({ markets: P.number }, ({ markets }) => (
      <Trans
        t={t}
        i18nKey="signal.log.studied"
        values={{ minutes, indicators, markets: t('signal.log.markets', { count: markets }) }}
        components={{ b }}
      />
    ))
    .otherwise(() => (
      <Trans t={t} i18nKey="signal.log.alone" values={{ minutes, indicators }} components={{ b }} />
    ));
}

function LogPoints({
  forecast,
  open,
  onShow,
}: {
  readonly forecast: ForecastNote;
  readonly open: boolean;
  readonly onShow: (row: string) => void;
}) {
  const { t } = useT('forecast');
  const why = useForecastWhy(forecast.id, open);
  return (
    <AsyncView
      query={why}
      errorTitle={t('why.failed')}
      loading={<PointsSkeleton count={forecast.points.length} />}
    >
      {(data) => <Points forecast={forecast} why={data} onShow={onShow} />}
    </AsyncView>
  );
}

function Points({
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
    <ol className="relative flex flex-col before:absolute before:start-3.5 before:top-5 before:bottom-5 before:w-px before:bg-linear-to-b before:from-foreground/12 before:to-foreground/4">
      {orderedPoints(why.points, stanceOf(forecast)).map(({ index, point }, place) => (
        <LogPoint
          key={index}
          id={pointKey(forecast.id, index)}
          point={point}
          place={place}
          open={open === index}
          onToggle={() => setOpen(open === index ? null : index)}
          onShow={onShow}
        />
      ))}
    </ol>
  );
}

function LogPoint({
  id,
  point,
  place,
  open,
  onToggle,
  onShow,
}: {
  readonly id: string;
  readonly point: WhyPoint;
  readonly place: number;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly onShow: (row: string) => void;
}) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const { row, figure } = point;
  const move = figure?.kind === 'price' ? priceMove(figure) : null;
  return (
    <li
      style={{ animationDelay: `${place * ENTER_STEP_MS}ms` }}
      className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 relative fill-mode-both motion-safe:animate-in motion-safe:duration-300"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="group focus-ring hover-neutral-soft grid w-full grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg py-2.25 pe-2 text-left transition-colors aria-expanded:bg-foreground/4"
      >
        <span aria-hidden className="flex justify-center">
          <span className={cn('size-2.25 rounded-full ring-3', nodeClass(point.stance))} />
        </span>
        <span className="text-foreground-soft text-sm transition-colors group-aria-expanded:text-foreground">
          <span className="sr-only">{`${t(`why.stance.${point.stance}`)}. `}</span>
          {point.claim}
        </span>
        <span className="grid justify-items-end gap-y-0.5 sm:grid-cols-[5rem_auto] sm:items-center sm:gap-x-3.5">
          <span
            data-shown={!open}
            className="transition-[opacity,scale] duration-200 ease-out data-[shown=false]:scale-90 data-[shown=false]:opacity-0 motion-reduce:transition-none max-sm:hidden"
          >
            {figure && <MiniFigure figure={figure} className="w-20" />}
          </span>
          <span className="whitespace-nowrap font-figure font-medium text-foreground text-sm">
            {point.value ?? (move === null ? null : fmt.change(move, 2))}
          </span>
        </span>
      </button>
      <Reveal open={open} id={id}>
        <div className="flex flex-col items-start gap-2 ps-10 pt-2 pb-4">
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

function Change({
  forecast,
  market,
  crossed,
}: {
  readonly forecast: ForecastNote;
  readonly market: MarketName;
  readonly crossed: boolean;
}) {
  const { t } = useT('forecast');
  const fmt = useFormatters();
  const locale = useLocale();
  const { invalidation } = forecast;
  if (!invalidation) return null;
  return (
    <p className="ps-10 text-meta text-muted-foreground">
      <Trans
        t={t}
        i18nKey={`why.change.${invalidation.when}`}
        values={{
          name: inSentence(market.name, locale),
          price: fmt.price(invalidation.price),
          level: t(`why.levels.${invalidation.level}`),
        }}
        components={{ b: <b className="font-figure font-medium text-foreground" /> }}
      />
      {crossed && <span className="text-warning"> {t(`why.crossed.${invalidation.when}`)}</span>}
    </p>
  );
}

function PointsSkeleton({ count }: { readonly count: number }) {
  const { t } = useT('forecast');
  return (
    <ul className="flex flex-col">
      {Array.from({ length: Math.max(count, 1) }, (_, i) => `point-${i}`).map((key) => (
        <li key={key} className="py-2.25 ps-10 text-sm">
          <SkeletonLines>{t('why.label')}</SkeletonLines>
        </li>
      ))}
    </ul>
  );
}
