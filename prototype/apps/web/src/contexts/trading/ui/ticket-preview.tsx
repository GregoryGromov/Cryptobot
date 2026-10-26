import { nextMinute } from '@reinforce/server/dto';
import { insetPanelClass } from '@reinforce/ui-primitives/inset-panel';
import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import { useServerNow } from '~/shared/api/live';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import type { TradePreview } from '../domain/ticket-vm';

function Row({ label, children }: { readonly label: ReactNode; readonly children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end">{children}</dd>
    </div>
  );
}

export function TicketPreview({ preview }: { readonly preview: TradePreview }) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const now = useServerNow(5_000);
  return (
    <div className={cn(insetPanelClass, 'flex flex-col gap-2 p-3')}>
      <dl className="flex flex-col gap-1.5 text-meta">
        <Row label={t('ticket.entry')}>
          <Numeral>{fmt.price(preview.entryPrice)}</Numeral>
        </Row>
        <Row label={t('levelAt.stop', { price: fmt.price(preview.stopPrice) })}>
          <Numeral tone="direction" direction="down" weight="medium">
            {fmt.usdSigned(-preview.lossAtStop)}
          </Numeral>
        </Row>
        <Row label={t('levelAt.take', { price: fmt.price(preview.takePrice) })}>
          <Numeral tone="direction" direction="up" weight="medium">
            {fmt.usdSigned(preview.gainAtTake)}
          </Numeral>
        </Row>
        <Row label={t('ticket.fees')}>
          <Numeral>{fmt.usd(preview.roundTripFee)}</Numeral>
        </Row>
      </dl>
      <p className="text-muted-foreground text-xs">
        {t('ticket.entryNote', { time: fmt.clock(nextMinute(now)), bps: preview.slippageBps })}
      </p>
    </div>
  );
}
