import type { Chat, ForecastNote, MarketName } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import type { TFunction } from 'i18next';
import { type ReactNode, useId, useState } from 'react';
import { match, P } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { Reveal } from '~/shared/ui/reveal';
import { useForecastInputs, useForecastWhy } from '../api/queries';
import { type PointTally, pointTally } from '../domain/episode-vm';
import { horizonWords } from '../domain/verdict';
import { AllData, type DataNav } from './all-data';
import { TradePanel, WhyPanel } from './why-section';

type Door = 'why' | 'trade' | 'data';

const doorClass =
  'focus-ring relative -mb-px flex items-baseline gap-1.5 whitespace-nowrap rounded-sm pb-2.5 font-medium text-muted-foreground text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-200 after:ease-out hover:text-foreground aria-expanded:text-foreground aria-expanded:after:scale-x-100 motion-reduce:after:transition-none';

const tallyWords = (tally: PointTally, t: TFunction<'forecast'>): string =>
  match(tally)
    .with({ kind: 'leaning' }, (s) =>
      [
        t('why.for', { count: s.backing }),
        s.against ? t('why.against', { count: s.against }) : null,
        s.risks ? t('why.risks', { count: s.risks }) : null,
      ]
        .filter((part) => part !== null)
        .join(', '),
    )
    .with({ kind: 'open' }, (s) =>
      [t('why.points', { count: s.points }), s.risks ? t('why.risks', { count: s.risks }) : null]
        .filter((part) => part !== null)
        .join(', '),
    )
    .exhaustive();

export function EpisodeDoors({
  forecast,
  market,
  record,
  crossed,
  open,
  onToggle,
}: {
  readonly forecast: ForecastNote;
  readonly market: MarketName;
  readonly record: Chat['record'];
  readonly crossed: boolean;
  readonly open: boolean;
  readonly onToggle: () => void;
}) {
  const { t } = useT('forecast');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  const id = useId();
  const [side, setSide] = useState<Exclude<Door, 'why'> | null>(null);
  const [nav, setNav] = useState<DataNav>({ tab: null, focus: null, jump: 0 });
  const shown: Door | null = open ? 'why' : side;
  const why = useForecastWhy(forecast.id, shown === 'why');
  const inputs = useForecastInputs(forecast.id, shown === 'data');
  const asOf = shown === 'data' ? inputs.data?.asOf : why.data?.asOf;
  const pick = (door: Door) => {
    if (door === 'why') {
      setSide(null);
      onToggle();
      return;
    }
    if (open) onToggle();
    setSide(shown === door ? null : door);
  };
  const showInData = (row: string) => {
    setNav({ tab: null, focus: row, jump: nav.jump + 1 });
    if (open) onToggle();
    setSide('data');
  };
  const plan = match(forecast.plan)
    .with({ action: 'FLAT' }, () => t('doors.flat'))
    .with({ action: P.union('LONG', 'SHORT') }, (p) =>
      t('doors.plan', { side: format(`action.${p.action}`), term: horizonWords(format, p.horizon) }),
    )
    .exhaustive();
  const single = forecast.horizons.length === 1;
  const all: readonly {
    readonly door: Door;
    readonly title: string;
    readonly hint: string;
    readonly said: boolean;
  }[] = [
    { door: 'why', title: t('doors.why'), hint: tallyWords(pointTally(forecast), t), said: false },
    { door: 'trade', title: t('doors.trade'), hint: plan, said: true },
    { door: 'data', title: t('data.toggle'), hint: t('doors.dataHint'), said: false },
  ];
  const doors = single ? all.filter(({ door }) => door !== 'trade') : all;
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-5 border-foreground/9 border-b">
        {doors.map(({ door, title, hint, said }) => (
          <button
            key={door}
            type="button"
            aria-expanded={shown === door}
            aria-controls={`${id}-${door}`}
            onClick={() => pick(door)}
            className={doorClass}
          >
            {title}
            <span className={cn('font-normal text-muted-foreground', said ? 'max-sm:sr-only' : 'sr-only')}>
              {` ${hint}`}
            </span>
          </button>
        ))}
        {shown !== null && shown !== 'trade' && asOf !== undefined && (
          <span
            title={t('why.asOf', { time: fmt.clock(asOf) })}
            className="motion-safe:fade-in ms-auto text-muted-foreground text-xs motion-safe:animate-in motion-safe:duration-300 max-sm:hidden"
          >
            {t('doors.snapshot', { time: fmt.clock(asOf) })}
          </span>
        )}
      </div>
      <Panel id={`${id}-why`} open={shown === 'why'} scope="forecast-why">
        <WhyPanel forecast={forecast} market={market} crossed={crossed} onShow={showInData} />
      </Panel>
      <Panel id={`${id}-trade`} open={shown === 'trade'} scope="forecast-trade">
        <TradePanel forecast={forecast} record={record} />
      </Panel>
      <Panel id={`${id}-data`} open={shown === 'data'} scope="forecast-data">
        <AllData
          forecast={forecast}
          nav={nav}
          onOpen={(tab) => setNav({ tab, focus: tab === null ? null : nav.focus, jump: nav.jump })}
        />
      </Panel>
    </div>
  );
}

function Panel({
  id,
  open,
  scope,
  children,
}: {
  readonly id: string;
  readonly open: boolean;
  readonly scope: string;
  readonly children: ReactNode;
}) {
  return (
    <Reveal open={open} id={id}>
      <div className="pt-1.5">
        <AppBoundary tier="panel" scope={scope}>
          {children}
        </AppBoundary>
      </div>
    </Reveal>
  );
}
