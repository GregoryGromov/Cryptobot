import type { TradeRow, Trades } from '@reinforce/server/dto';
import {
  sheetBarActionClass,
  sheetBarClass,
  sheetBarDescriptionClass,
  sheetBarTitleClass,
  sheetPanelClass,
} from '@reinforce/ui-primitives/sheet';
import { Button } from '@reinforce/ui-react/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@reinforce/ui-react/sheet';
import { Skeleton } from '@reinforce/ui-react/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { XIcon } from 'lucide-react';
import { tradeStatusText } from '~/contexts/trading/domain/trade-status';
import { trpc } from '~/shared/api/trpc';
import { useFormatters } from '~/shared/format/use-formatters';
import { useIsDesktop } from '~/shared/hooks/use-media-query';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { findTrade } from '../domain/book-vm';
import { TradeDetail } from './trade-detail';

export function TradeSheet({
  tradeId,
  trades,
}: {
  readonly tradeId: string | undefined;
  readonly trades: Trades | undefined;
}) {
  const desktop = useIsDesktop();
  const navigate = useNavigate({ from: '/portfolio' });
  const close = () =>
    void navigate({ search: (prev) => ({ ...prev, trade: undefined }), replace: true, resetScroll: false });
  return (
    <Sheet
      open={tradeId !== undefined}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent side={desktop ? 'right' : 'bottom'} closeButton={false} className={sheetPanelClass}>
        {tradeId !== undefined && (
          <TradeSheetBody
            tradeId={tradeId}
            listed={trades === undefined ? null : findTrade(trades, tradeId)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TradeSheetBody({ tradeId, listed }: { readonly tradeId: string; readonly listed: TradeRow | null }) {
  const { t } = useT('trading');
  const { t: tp } = useT('portfolio');
  const { t: tc } = useT('common');
  const fmt = useFormatters();
  const chart = useQuery(trpc.views.tradeChart.queryOptions(tradeId, { meta: { silent: true } }));
  const row = chart.data?.trade ?? listed;
  return (
    <>
      <div className={sheetBarClass}>
        <SheetTitle className={sheetBarTitleClass}>
          {row === null ? tp('trades.title') : t('title', { side: t(`side.${row.side}`), market: row.name })}
        </SheetTitle>
        <SheetClose asChild>
          <Button variant="ghost" size="icon-sm" aria-label={tc('close')} className={sheetBarActionClass}>
            <XIcon />
          </Button>
        </SheetClose>
      </div>
      <SheetDescription className={sheetBarDescriptionClass}>
        {row === null ? tp('detail.missing') : tradeStatusText({ t, clock: fmt.dateTime }, row)}
      </SheetDescription>
      <div className="overflow-y-auto px-5 pt-4 pb-5">
        <AppBoundary tier="panel" scope="trade-detail">
          {row === null ? (
            chart.isPending && <Skeleton className="h-56 w-full" />
          ) : (
            <TradeDetail row={row} chart={chart} />
          )}
        </AppBoundary>
      </div>
    </>
  );
}
