import type { ChatProposal, Estimate } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@reinforce/ui-react/dialog';
import type { ReactNode } from 'react';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { SideArrow, sideButtonClass } from './side-button';

function Row({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end">{children}</dd>
    </div>
  );
}

/** The last word before a trade opens from the conversation: what goes in, and what it stands to lose or win. */
export function DealConfirm({
  proposal,
  estimate,
  market,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  readonly proposal: ChatProposal;
  readonly estimate: Estimate;
  readonly market: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly pending: boolean;
  readonly onConfirm: () => void;
}) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const action = t(`deal.open.${proposal.side}`);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" closeButton={false}>
        <DialogHeader>
          <DialogTitle>{t('deal.confirm.title', { action, market })}</DialogTitle>
          <DialogDescription>
            {t('deal.confirm.lead', { time: fmt.clock(estimate.exitBy) })}
          </DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col gap-1.5 text-sm">
          <Row label={t('deal.confirm.amount')}>
            <Numeral>{fmt.usd(proposal.sizeUsd)}</Numeral>
          </Row>
          <Row label={t('deal.confirm.atStop')}>
            <Numeral tone="direction" direction="down" weight="medium">
              {fmt.usdSigned(-estimate.lossAtStop)}
            </Numeral>
          </Row>
          <Row label={t('deal.confirm.atTake')}>
            <Numeral tone="direction" direction="up" weight="medium">
              {fmt.usdSigned(estimate.gainAtTake)}
            </Numeral>
          </Row>
        </dl>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>
            {t('deal.confirm.cancel')}
          </Button>
          <Button
            variant={null}
            className={sideButtonClass(proposal.side)}
            loading={pending}
            onClick={onConfirm}
          >
            <SideArrow side={proposal.side} />
            {action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
