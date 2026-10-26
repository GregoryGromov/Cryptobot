import type { TradeRow } from '@reinforce/server/dto';
import { cardVariants } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@reinforce/ui-react/tabs';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { match } from 'ts-pattern';
import { journalRows } from '~/contexts/broker/domain/journal-vm';
import { ForecastJournal } from '~/contexts/broker/ui/broker-journal';
import { tradeAmount, tradeResult, tradeStatusText } from '~/contexts/trading/domain/trade-status';
import { useTradingMode } from '~/shared/api/trading-mode';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { Numeral } from '~/shared/ui/numeral';
import { type BookView, rowAt } from '../domain/book-vm';
import { TRADE_TABS, type TradesTab } from '../domain/portfolio-search';
import { firstPage, returnOnAmount, tradeClose } from '../domain/trade-line';

export const TRADES_CLASS = cn(cardVariants({ size: 'sm' }), '@container min-w-0 gap-0 pt-1 pb-3');
export const TRADES_TABS_CLASS = 'w-full justify-start gap-5 border-foreground/7 border-b px-4';
export const LINE_CLASS =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-transparent border-s-[3px] ps-3.25 pe-4 text-meta';
export const OPEN_COLUMNS = '@xl:grid-cols-[minmax(0,1fr)_7rem_13.5rem_10.5rem]';
export const HEAD_CLASS = 'pt-2.5 pb-1 text-muted-foreground text-xs';
export const WIDE_CLASS = 'hidden @xl:block';
const DONE_COLUMNS = '@xl:grid-cols-[8rem_minmax(0,1fr)_7rem_7.5rem_10.5rem]';
const ROW_CLASS = 'focus-ring hover-neutral-soft py-1.5 transition-colors';
const NOTE_CLASS = 'truncate text-muted-foreground text-xs @xl:hidden';

const SIDE_INK: Record<TradeRow['side'], string> = { LONG: 'text-up', SHORT: 'text-down' };
const SIDE_EDGE: Record<TradeRow['side'], string> = {
  LONG: 'border-up bg-linear-to-r from-up/16 to-60% to-transparent',
  SHORT: 'border-down bg-linear-to-r from-down/16 to-60% to-transparent',
};

function TradeName({ row }: { readonly row: TradeRow }) {
  const { t } = useT('portfolio');
  return (
    <span className={cn('truncate', SIDE_INK[row.side])}>
      <span className="font-semibold">{row.name}</span> {t(`trades.side.${row.side}`)}
    </span>
  );
}

function TradeOutcome({ row }: { readonly row: TradeRow }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  return match(tradeResult(row))
    .with({ kind: 'pnl' }, ({ pnl }) => {
      const amount = tradeAmount(row);
      const pct = amount === null ? null : returnOnAmount(pnl, amount);
      return (
        <Numeral tone="direction" direction={directionOf(pnl, 2)}>
          {pct === null
            ? fmt.usdSigned(pnl)
            : t('trades.resultPct', { amount: fmt.usdSigned(pnl), pct: fmt.change(pct, 2) })}
        </Numeral>
      );
    })
    .with({ kind: 'unvalued' }, () => <span className="text-muted-foreground">{t('trades.unvalued')}</span>)
    .with({ kind: 'none' }, () => <Numeral tone="muted">—</Numeral>)
    .exhaustive();
}

function TradeLink({
  row,
  className,
  children,
}: {
  readonly row: TradeRow;
  readonly className: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      to="/portfolio"
      search={(prev) => ({ ...prev, trade: row.id })}
      resetScroll={false}
      className={cn(LINE_CLASS, ROW_CLASS, className)}
    >
      {children}
    </Link>
  );
}

function OpenLine({ row, now }: { readonly row: TradeRow; readonly now: number }) {
  const { t } = useT('portfolio');
  const { t: tt } = useT('trading');
  const fmt = useFormatters();
  const amount = tradeAmount(row);
  const sum = amount === null ? '—' : fmt.usd(amount);
  const closes = match(tradeClose(row, now))
    .with({ kind: 'due' }, ({ at, left }) =>
      t('trades.closesAt', { time: fmt.clock(at), left: fmt.duration(left) }),
    )
    .with({ kind: 'waiting' }, () => tradeStatusText({ t: tt, clock: fmt.clock }, row))
    .exhaustive();
  return (
    <TradeLink row={row} className={cn(OPEN_COLUMNS, SIDE_EDGE[row.side])}>
      <span className="flex min-w-0 flex-col">
        <TradeName row={row} />
        <span className={NOTE_CLASS}>{t('trades.note', { first: sum, second: closes })}</span>
      </span>
      <Numeral className={cn(WIDE_CLASS, 'text-end')}>{sum}</Numeral>
      <span className={cn(WIDE_CLASS, 'truncate text-end text-muted-foreground')}>{closes}</span>
      <span className="whitespace-nowrap text-end">
        <TradeOutcome row={row} />
      </span>
    </TradeLink>
  );
}

function DoneLine({ row }: { readonly row: TradeRow }) {
  const { t } = useT('portfolio');
  const { t: tt } = useT('trading');
  const fmt = useFormatters();
  const amount = tradeAmount(row);
  const at = fmt.dateTime(rowAt(row));
  const reason = match(row)
    .with({ status: 'closed' }, (r) => tt(`exit.${r.exit.reason}`))
    .with({ status: 'rejected' }, () => t('trades.rejected'))
    .with({ status: 'pending' }, { status: 'open' }, () => '')
    .exhaustive();
  return (
    <TradeLink row={row} className={DONE_COLUMNS}>
      <Numeral tone="muted" className={WIDE_CLASS}>
        {at}
      </Numeral>
      <span className="flex min-w-0 flex-col">
        <TradeName row={row} />
        <span className={NOTE_CLASS}>{t('trades.note', { first: at, second: reason })}</span>
      </span>
      <Numeral className={cn(WIDE_CLASS, 'text-end')}>{amount === null ? '—' : fmt.usd(amount)}</Numeral>
      <span className={cn(WIDE_CLASS, 'truncate text-muted-foreground')}>{reason}</span>
      <span className="whitespace-nowrap text-end">
        <TradeOutcome row={row} />
      </span>
    </TradeLink>
  );
}

function Empty({ children }: { readonly children: string }) {
  return <p className="px-4 py-1.5 text-foreground-soft text-meta">{children}</p>;
}

const firstTab = (view: BookView, forecasts: number): TradesTab => {
  if (view.active.length > 0) return 'open';
  if (view.done.length > 0) return 'history';
  return forecasts > 0 ? 'forecasts' : 'open';
};

export function BookTrades({ view, tab }: { readonly view: BookView; readonly tab: TradesTab | undefined }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  const navigate = useNavigate({ from: '/portfolio' });
  const { horizon } = useTradingMode();
  const journal = useQuery(trpc.views.journal.queryOptions(undefined, { meta: { silent: true } }));
  const forecasts = journal.data ? journalRows(journal.data, horizon).length : 0;
  const shown = tab ?? firstTab(view, forecasts);
  const [all, setAll] = useState(false);
  const choose = (value: string) => {
    const next = TRADE_TABS.find((key) => key === value);
    if (next === undefined) return;
    void navigate({ search: (prev) => ({ ...prev, tab: next }), replace: true, resetScroll: false });
  };
  const emptyOpen = match(view.period.kind)
    .with('ended', () => (view.done.length > 0 ? t('trades.emptyEnded') : t('trades.emptyCycle')))
    .with('current', () => (view.key === 'user' ? t('trades.emptyUser') : t('trades.emptyAgent')))
    .exhaustive();
  const emptyHistory = match(view.period.kind)
    .with('ended', () => t('trades.emptyCycle'))
    .with('current', () => t('trades.emptyHistory'))
    .exhaustive();
  const done = firstPage(view.done, all);
  return (
    <section aria-label={t('trades.title')} className={TRADES_CLASS}>
      <Tabs value={shown} onValueChange={choose} className="gap-0">
        <TabsList variant="line" className={TRADES_TABS_CLASS}>
          <TabsTrigger value="open" className="flex-none px-0">
            {t('trades.counted', { label: t('trades.positions'), n: fmt.int(view.active.length) })}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-none px-0">
            {t('trades.counted', { label: t('trades.history'), n: fmt.int(view.done.length) })}
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex-none px-0">
            {t('trades.counted', { label: t('trades.forecasts'), n: fmt.int(forecasts) })}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="flex flex-col">
          <div aria-hidden className={cn(LINE_CLASS, OPEN_COLUMNS, HEAD_CLASS)}>
            <span>{t('trades.cols.trade')}</span>
            <span className={cn(WIDE_CLASS, 'text-end')}>{t('trades.cols.amount')}</span>
            <span className={cn(WIDE_CLASS, 'text-end')}>{t('trades.cols.closes')}</span>
            <span className="text-end">{t('trades.cols.result')}</span>
          </div>
          {view.active.length === 0 ? (
            <Empty>{emptyOpen}</Empty>
          ) : (
            view.active.map((row) => <OpenLine key={row.id} row={row} now={view.until} />)
          )}
        </TabsContent>
        <TabsContent value="history" className="flex flex-col">
          <div aria-hidden className={cn(LINE_CLASS, DONE_COLUMNS, HEAD_CLASS)}>
            <span className={WIDE_CLASS}>{t('trades.cols.closed')}</span>
            <span>{t('trades.cols.trade')}</span>
            <span className={cn(WIDE_CLASS, 'text-end')}>{t('trades.cols.amount')}</span>
            <span className={WIDE_CLASS}>{t('trades.cols.reason')}</span>
            <span className="text-end">{t('trades.cols.result')}</span>
          </div>
          {done.length === 0 ? (
            <Empty>{emptyHistory}</Empty>
          ) : (
            done.map((row) => <DoneLine key={row.id} row={row} />)
          )}
          {view.done.length > done.length && (
            <Button variant="ghost" size="sm" className="ms-1.5 mt-1 self-start" onClick={() => setAll(true)}>
              {t('trades.showAll', { n: fmt.int(view.done.length) })}
            </Button>
          )}
        </TabsContent>
        <TabsContent value="forecasts" className="flex flex-col">
          <AppBoundary tier="panel" scope="portfolio-forecasts">
            <ForecastJournal />
          </AppBoundary>
        </TabsContent>
      </Tabs>
    </section>
  );
}
