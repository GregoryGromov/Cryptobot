import type { ForecastNote, Inputs } from '@reinforce/server/dto';
import { disclosureChevronClass } from '@reinforce/ui-primitives/collapsible';
import { SkeletonLines } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId } from 'react';
import { match } from 'ts-pattern';
import { usePrefersReducedMotion } from '~/shared/hooks/use-media-query';
import { useT } from '~/shared/i18n';
import { AsyncView } from '~/shared/ui/async-view';
import { Reveal } from '~/shared/ui/reveal';
import { useForecastInputs } from '../api/queries';
import { outcomesOf } from '../domain/horizon-vm';
import { type DataSection, type DataTab, rowAnchor, sectionsOf, tabOfRow } from '../domain/inputs-vm';
import { candlesMini, oddsMini } from '../domain/mini-vm';
import { AnswerTab } from './answer-tab';
import { CandlesTab } from './candles-tab';
import { MiniShape } from './figures/mini-figure';
import { InputRowView } from './input-row';

export type DataNav = {
  readonly tab: DataTab | null;
  readonly focus: string | null;
  readonly jump: number;
};

const ENTER_STEP_MS = 40;
const OPENED_MS = 240;
const SKELETON_ROWS = ['candles', 'move', 'volume', 'answer'] as const;

// A section's content comes in each time it opens: the attribute flips, so the animation starts over.
const enterClass =
  'group-data-[shown=true]/section:motion-safe:fade-in group-data-[shown=true]/section:motion-safe:slide-in-from-top-1 group-data-[shown=true]/section:motion-safe:animate-in group-data-[shown=true]/section:motion-safe:duration-300';

const rowClass =
  'group focus-ring hover-neutral-soft -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.25 text-left transition-colors aria-expanded:bg-foreground/4';

export function AllData({
  forecast,
  nav,
  onOpen,
}: {
  readonly forecast: ForecastNote;
  readonly nav: DataNav;
  readonly onOpen: (section: DataTab | null) => void;
}) {
  const { t } = useT('forecast');
  const inputs = useForecastInputs(forecast.id);
  return (
    <AsyncView query={inputs} errorTitle={t('data.failed')} loading={<AllDataSkeleton />}>
      {(data) => <Sections forecast={forecast} data={data} nav={nav} onOpen={onOpen} />}
    </AsyncView>
  );
}

function Sections({
  forecast,
  data,
  nav,
  onOpen,
}: {
  readonly forecast: ForecastNote;
  readonly data: Inputs;
  readonly nav: DataNav;
  readonly onOpen: (section: DataTab | null) => void;
}) {
  const { t } = useT('forecast');
  const reduced = usePrefersReducedMotion();
  const id = useId();
  const open = nav.tab ?? tabOfRow(data, nav.focus);
  const { focus, jump } = nav;

  useEffect(() => {
    if (focus === null || jump === 0) return;
    const timer = setTimeout(
      () =>
        document
          .getElementById(rowAnchor(forecast.id, focus))
          ?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }),
      OPENED_MS,
    );
    return () => clearTimeout(timer);
  }, [forecast.id, focus, jump, reduced]);

  return (
    <ul aria-label={t('data.label')} className="flex flex-col">
      {sectionsOf(data).map((section, place) => (
        <li
          key={section.id}
          style={{ animationDelay: `${place * ENTER_STEP_MS}ms` }}
          className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 fill-mode-both motion-safe:animate-in motion-safe:duration-300"
        >
          <button
            type="button"
            aria-expanded={open === section.id}
            aria-controls={`${id}-${section.id}`}
            onClick={() => onOpen(open === section.id ? null : section.id)}
            className={rowClass}
          >
            <span className="min-w-0 flex-1 text-foreground-soft text-sm transition-colors group-aria-expanded:text-foreground">
              {t(`data.tabs.${section.id}`)}
            </span>
            <Gist section={section} forecast={forecast} data={data} open={open === section.id} />
            <ChevronDown
              aria-hidden
              className={cn(disclosureChevronClass, 'size-3.5 text-muted-foreground')}
            />
          </button>
          <Reveal open={open === section.id} id={`${id}-${section.id}`}>
            <div data-shown={open === section.id} className="group/section pt-2 pb-4">
              <div className={enterClass}>
                <SectionBody section={section.id} forecast={forecast} data={data} focus={focus} />
              </div>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

function Gist({
  section,
  forecast,
  data,
  open,
}: {
  readonly section: DataSection;
  readonly forecast: ForecastNote;
  readonly data: Inputs;
  readonly open: boolean;
}) {
  const { t } = useT('forecast');
  const shown = forecast.horizons[0];
  const mini =
    section.id === 'candles'
      ? candlesMini(data.candles.map((candle) => candle.c))
      : section.id === 'answer' && shown
        ? oddsMini(outcomesOf(forecast.p0, shown))
        : null;
  const words = match(section)
    .with({ id: 'answer' }, () => [])
    .with({ rows: null }, () => [t('data.minutes', { count: data.quality.bars })])
    .otherwise(({ rows, cited }) => [
      t('data.rows', { count: rows ?? 0 }),
      ...(cited > 0 ? [t('data.citedRows', { count: cited })] : []),
    ]);
  return (
    <span className="flex shrink-0 items-center gap-3">
      {mini && (
        <span
          data-shown={!open}
          className="transition-[opacity,scale] duration-200 ease-out data-[shown=false]:scale-90 data-[shown=false]:opacity-0 motion-reduce:transition-none"
        >
          <MiniShape mini={mini} className="w-16 sm:w-20" />
        </span>
      )}
      {words.length > 0 && (
        <span className="font-figure text-muted-foreground text-xs">{words.join(' · ')}</span>
      )}
    </span>
  );
}

function SectionBody({
  section,
  forecast,
  data,
  focus,
}: {
  readonly section: DataTab;
  readonly forecast: ForecastNote;
  readonly data: Inputs;
  readonly focus: string | null;
}) {
  if (section === 'candles') return <CandlesTab data={data} />;
  if (section === 'answer') return <AnswerTab forecast={forecast} data={data} />;
  return (
    <div className="-mx-2.5 flex flex-col gap-1">
      {data.groups
        .find((group) => group.id === section)
        ?.rows.map((row) => (
          <InputRowView
            key={row.id}
            row={row}
            anchor={rowAnchor(forecast.id, row.id)}
            cited={data.cited.includes(row.id)}
            lit={focus === row.id}
          />
        ))}
    </div>
  );
}

function AllDataSkeleton() {
  const { t } = useT('forecast');
  return (
    <ul className="flex flex-col">
      {SKELETON_ROWS.map((section) => (
        <li key={section} className="py-2.25 text-sm">
          <SkeletonLines>{t(`data.tabs.${section}`)}</SkeletonLines>
        </li>
      ))}
    </ul>
  );
}
