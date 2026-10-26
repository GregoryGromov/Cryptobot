import type { MarketList } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { Switch } from '@reinforce/ui-react/switch';
import { cn } from '@reinforce/ui-styles/cn';
import { Plus, X } from 'lucide-react';
import { useId } from 'react';
import { useMarketPicker } from '~/app/market-picker/market-picker';
import { useComparedCandles } from '~/contexts/markets/api/use-compared-candles';
import { nameOf } from '~/contexts/markets/domain/market-list-vm';
import { DAY, MOST_COMPARED, moveOver } from '~/contexts/markets/domain/market-moves';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { PEER_DOT_CLASSES } from './chart-palette';
import { PANEL_HEAD_CLASS, PANEL_TITLE_CLASS, SIDE_ROW_CLASS } from './terminal-layout';
import type { MarketCompare } from './use-compare';

/** The markets this one is compared with over the day, up to three, and whether the chart draws them. */
export function MarketCompareBlock({
  compare,
  list,
}: {
  readonly compare: MarketCompare;
  readonly list: MarketList;
}) {
  const { t } = useT('markets');
  const f = useFormatters();
  const id = useId();
  const pickMarket = useMarketPicker();
  const days = useComparedCandles(compare.peers, '5m');
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <div className={PANEL_HEAD_CLASS}>
        <h2 id={id} className={PANEL_TITLE_CLASS}>
          {t('compare.title')}
        </h2>
        <Switch
          size="sm"
          checked={compare.on}
          disabled={compare.peers.length === 0}
          onCheckedChange={compare.toggle}
          aria-label={t('compare.toggle')}
        />
      </div>
      <ul className="flex flex-col">
        {compare.peers.map((coin, index) => {
          const day = days[index]?.candles;
          const change = day ? moveOver(day, DAY) : null;
          const name = nameOf(list, coin);
          return (
            <li key={coin} className={cn(SIDE_ROW_CLASS, 'py-0.5')}>
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    'size-2 shrink-0 rounded-full transition-colors',
                    compare.on ? PEER_DOT_CLASSES[index] : 'border border-muted-foreground',
                  )}
                />
                <span className={cn('truncate', compare.on ? 'text-foreground' : 'text-muted-foreground')}>
                  {name}
                </span>
              </span>
              <span className="flex items-center gap-1">
                {change !== null && (
                  <Numeral tone="direction" direction={directionOf(change, 2)} weight="semibold">
                    {f.change(change, 2)}
                  </Numeral>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('compare.remove', { name })}
                  title={t('compare.remove', { name })}
                  className="-me-2 text-muted-foreground"
                  onClick={() => compare.remove(coin)}
                >
                  <X aria-hidden />
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      {compare.peers.length < MOST_COMPARED && (
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 self-start text-muted-foreground"
          onClick={() =>
            pickMarket({ title: t('compare.pick'), onPick: (market) => compare.add(market.coin) })
          }
        >
          <Plus aria-hidden />
          {t('compare.add')}
        </Button>
      )}
    </section>
  );
}
