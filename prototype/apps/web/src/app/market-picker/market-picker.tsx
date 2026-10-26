import type { AssetClass, MarketList } from '@reinforce/server/dto';
import { commandInputClass, commandInputIconClass } from '@reinforce/ui-primitives/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@reinforce/ui-react/dialog';
import { Kbd } from '@reinforce/ui-react/kbd';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { type RefObject, useId, useRef, useState } from 'react';
import { trpc } from '~/shared/api/trpc';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { AsyncView } from '~/shared/ui/async-view';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import {
  type MarketPickRequest,
  useMarketPickerActions,
  useMarketPickerOpen,
  useMarketPickerStore,
  useMarketPickRequest,
} from './market-picker-store';

export type { MarketPickRequest, PickedMarket } from './market-picker-store';

type ClassFilter = AssetClass | 'all';

type Market = MarketList[number]['markets'][number];

const TWIN_WIDTHS = ['w-28', 'w-36', 'w-24', 'w-32', 'w-40', 'w-20', 'w-28', 'w-36'] as const;

const columnsClass = 'grid-cols-[minmax(0,1fr)_6rem_4.375rem] md:grid-cols-[minmax(0,1fr)_7.5rem_5.625rem]';

const rowColumnsClass =
  'grid-cols-[auto_minmax(0,1fr)_6rem_4.375rem] md:grid-cols-[auto_minmax(0,1fr)_7.5rem_5.625rem]';

const classRowClass =
  'focus-ring hover-neutral-soft shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-left font-medium text-foreground text-meta transition-colors aria-checked:bg-foreground/7';

export const useMarketPicker = (): ((request: MarketPickRequest) => void) =>
  useMarketPickerStore((state) => state.actions.opened);

const marketsOf = (catalog: MarketList, filter: ClassFilter, query: string): readonly Market[] => {
  const needle = query.trim().toLowerCase();
  return catalog
    .filter((group) => filter === 'all' || group.cls === filter)
    .flatMap((group) => group.markets)
    .filter(
      (market) =>
        needle === '' ||
        market.name.toLowerCase().includes(needle) ||
        market.ticker.toLowerCase().includes(needle),
    );
};

export function MarketPickerHost() {
  const { t } = useT(['shell', 'common']);
  const open = useMarketPickerOpen();
  const request = useMarketPickRequest();
  const { closed } = useMarketPickerActions();
  const search = useRef<HTMLInputElement>(null);
  return (
    <Dialog
      open={open && request !== null}
      onOpenChange={(next) => {
        if (!next) closed();
      }}
    >
      <DialogContent
        size="xl"
        closeButton={{ label: t('common:close') }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          search.current?.focus();
        }}
        className="flex h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[60rem] md:h-[min(40rem,calc(100dvh-4rem))] [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4"
      >
        <DialogTitle className="shrink-0 border-border border-b px-13 py-3.5 text-center">
          {request?.title}
        </DialogTitle>
        <DialogDescription className="sr-only">{t('picker.pick')}</DialogDescription>
        {request && <PickerBody request={request} search={search} onClose={closed} />}
        <div className="hidden shrink-0 justify-end gap-4.5 border-border border-t px-4 py-2.5 text-meta text-muted-foreground md:flex">
          <span className="inline-flex items-center gap-1.5">
            {t('picker.choose')} <Kbd size="sm">Enter</Kbd>
          </span>
          <span className="inline-flex items-center gap-1.5">
            {t('common:close')} <Kbd size="sm">Esc</Kbd>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({
  request,
  search,
  onClose,
}: {
  readonly request: MarketPickRequest;
  readonly search: RefObject<HTMLInputElement | null>;
  readonly onClose: () => void;
}) {
  const { t } = useT('shell');
  const catalog = useQuery(trpc.views.catalog.queryOptions());
  const [filter, setFilter] = useState<ClassFilter>('all');
  const [query, setQuery] = useState('');
  const list = useId();
  const markets = marketsOf(catalog.data ?? [], filter, query);
  const choose = (market: Market) => {
    onClose();
    request.onPick({
      coin: market.coin,
      name: market.name,
      ticker: market.ticker,
      cls: market.cls,
      key: market.key,
    });
  };
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[12.5rem_minmax(0,1fr)] md:grid-rows-1">
      <ClassChoice catalog={catalog.data ?? []} value={filter} onChange={setFilter} />
      <div className="flex min-h-0 flex-col">
        <label className="flex shrink-0 items-center gap-2.5 border-border border-b px-3 py-3 md:px-4">
          <Search aria-hidden className={commandInputIconClass} strokeWidth={1.75} />
          <input
            ref={search}
            type="text"
            role="combobox"
            aria-controls={list}
            aria-expanded
            aria-label={t('picker.search')}
            autoComplete="off"
            spellCheck={false}
            className={cn(commandInputClass, 'min-w-0 text-base')}
            placeholder={t('picker.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              const first = markets[0];
              if (event.key !== 'Enter' || !first) return;
              event.preventDefault();
              choose(first);
            }}
          />
        </label>
        <div
          aria-hidden
          className={cn(
            'grid h-9.5 shrink-0 items-center gap-3 border-border border-b px-3 text-meta text-muted-foreground md:px-4',
            columnsClass,
          )}
        >
          <span>{t('picker.market')}</span>
          <span className="text-right">{t('picker.price')}</span>
          <span className="text-right">{t('picker.hour')}</span>
        </div>
        <div
          id={list}
          role="listbox"
          aria-label={request.title}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <AsyncView query={catalog} errorTitle={t('picker.failed')} loading={<RowsTwin />}>
            {() =>
              markets.length === 0 ? (
                <p className="px-3 py-5 text-meta text-muted-foreground md:px-4">{t('picker.none')}</p>
              ) : (
                markets.map((market, index) => (
                  <MarketRow key={market.key} market={market} first={index === 0} onPick={choose} />
                ))
              )
            }
          </AsyncView>
        </div>
      </div>
    </div>
  );
}

function ClassChoice({
  catalog,
  value,
  onChange,
}: {
  readonly catalog: MarketList;
  readonly value: ClassFilter;
  readonly onChange: (value: ClassFilter) => void;
}) {
  const { t } = useT('shell');
  return (
    <div
      role="radiogroup"
      aria-label={t('picker.classes')}
      className="flex min-h-0 gap-0.5 overflow-x-auto overflow-y-hidden border-border border-b px-2 py-2 [scrollbar-width:none] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-e md:border-b-0 md:py-2.5"
    >
      {/* biome-ignore lint/a11y/useSemanticElements: a class is a row to press in a list, not a form radio. */}
      <button
        type="button"
        role="radio"
        aria-checked={value === 'all'}
        className={classRowClass}
        onClick={() => onChange('all')}
      >
        {t('picker.all')}
      </button>
      <span aria-hidden className="hidden px-2.5 pt-2.5 pb-1 text-meta text-muted-foreground md:block">
        {t('picker.classes')}
      </span>
      {catalog.map((group) => (
        // biome-ignore lint/a11y/useSemanticElements: a class is a row to press in a list, not a form radio.
        <button
          key={group.cls}
          type="button"
          role="radio"
          aria-checked={value === group.cls}
          className={classRowClass}
          onClick={() => onChange(group.cls)}
        >
          {group.title}
        </button>
      ))}
    </div>
  );
}

function MarketRow({
  market,
  first,
  onPick,
}: {
  readonly market: Market;
  readonly first: boolean;
  readonly onPick: (market: Market) => void;
}) {
  const fmt = useFormatters();
  return (
    <button
      type="button"
      role="option"
      aria-selected={first}
      onClick={() => onPick(market)}
      className={cn(
        'focus-ring hover-neutral-soft grid h-13 w-full items-center gap-3 px-3 text-left text-foreground text-row transition-colors md:px-4',
        rowColumnsClass,
      )}
    >
      <CoinLogo coin={market.coin} ticker={market.ticker} className="size-7.5" />
      <span className="flex min-w-0 flex-col leading-tight">
        <b className="truncate font-semibold">{market.name}</b>
        {market.ticker !== market.name && (
          <span className="truncate text-meta text-muted-foreground">{market.ticker}</span>
        )}
      </span>
      <Numeral className="text-right">{market.price === null ? '—' : fmt.price(market.price)}</Numeral>
      {market.change1h === null ? (
        <Numeral tone="muted" className="text-right">
          —
        </Numeral>
      ) : (
        <Numeral tone="direction" direction={directionOf(market.change1h, 2)} className="text-right">
          {fmt.change(market.change1h, 2)}
        </Numeral>
      )}
    </button>
  );
}

function RowsTwin() {
  return (
    <div aria-hidden>
      {TWIN_WIDTHS.map((width, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the twin rows are a fixed list that never reorders.
        <div key={index} className="flex h-13 items-center gap-3 px-3 md:px-4">
          <Skeleton className="size-7.5 shrink-0 rounded-full" />
          <Skeleton className={cn('h-3.5 rounded-full', width)} />
        </div>
      ))}
    </div>
  );
}
