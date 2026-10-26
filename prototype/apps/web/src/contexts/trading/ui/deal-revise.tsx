import type { ChatProposal } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { useState } from 'react';
import { useT } from '~/shared/i18n';
import { failureText, useReviseProposal } from '../api/trading-mutations';

export function DealRevise({ proposal, topic }: { readonly proposal: ChatProposal; readonly topic: string }) {
  const { t } = useT('trading');
  const [requestId] = useState(() => crypto.randomUUID());
  const revise = useReviseProposal(topic);
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="secondary"
        className="self-start"
        loading={revise.isPending}
        disabled={revise.isPending || revise.isSuccess}
        onClick={() =>
          revise.mutate({
            topic,
            text: t('deal.reviseText'),
            requestId,
            reviseProposalVersionId: proposal.id,
          })
        }
      >
        {t('deal.revise')}
      </Button>
      {revise.isError && (
        <p role="alert" className="text-destructive text-meta">
          {failureText(revise.error)}
        </p>
      )}
    </div>
  );
}
