import type { ChatProposal } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { useState } from 'react';
import { useT } from '~/shared/i18n';
import { failureText, useConfirmProposal } from '../api/trading-mutations';
import { countdown } from '../domain/deal-phase';
import { DealConfirm } from './deal-confirm';
import { SideArrow, sideButtonClass } from './side-button';

export function DealActions({
  proposal,
  marketName,
  topic,
  now,
  size = 'sm',
}: {
  readonly proposal: ChatProposal;
  readonly marketName: string;
  readonly topic: string;
  readonly now: number;
  readonly size?: 'sm' | 'lg';
}) {
  const { t } = useT('trading');
  const confirm = useConfirmProposal(topic);
  const busy = confirm.isPending || confirm.isSuccess;
  const pressed = confirm.isPending ? confirm.variables.decision : null;
  const [asking, setAsking] = useState(false);
  const decide = (decision: 'confirmed' | 'declined') =>
    confirm.mutate({ versionId: proposal.id, decision }, { onError: () => setAsking(false) });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size={size}
          variant={null}
          className={sideButtonClass(proposal.side)}
          loading={pressed === 'confirmed'}
          disabled={busy || proposal.estimate === null}
          onClick={() => setAsking(true)}
        >
          <SideArrow side={proposal.side} />
          {t(`deal.open.${proposal.side}`)}
        </Button>
        <Button
          size={size}
          variant="secondary"
          loading={pressed === 'declined'}
          disabled={busy}
          onClick={() => decide('declined')}
        >
          {t('deal.skip')}
        </Button>
        <span className="ms-auto font-figure text-meta text-muted-foreground">
          {t('deal.validFor', { left: countdown(proposal.expiresAt - now) })}
        </span>
      </div>
      {proposal.estimate === null && (
        <p className="text-meta text-muted-foreground">{t('deal.waitingPrice')}</p>
      )}
      {proposal.estimate !== null && (
        <DealConfirm
          proposal={proposal}
          estimate={proposal.estimate}
          market={marketName}
          open={asking}
          onOpenChange={setAsking}
          pending={pressed === 'confirmed'}
          onConfirm={() => decide('confirmed')}
        />
      )}
      {confirm.isError && (
        <p role="alert" className="text-destructive text-meta">
          {failureText(confirm.error)}
        </p>
      )}
    </div>
  );
}
