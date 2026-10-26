import type { ChatProposal } from '@reinforce/server/dto';
import { match, P } from 'ts-pattern';
import { useServerNow } from '~/shared/api/live';
import { useT } from '~/shared/i18n';
import { dealPhase } from '../domain/deal-phase';
import { DealActions } from './deal-actions';
import { DealHead, dealTickMs } from './deal-card';
import { DealRevise } from './deal-revise';

/** The broker's offer inside the forecast it comes from: its head and the buttons; its levels are on the chart above. */
export function DealPart({
  proposal,
  marketName,
  topic,
}: {
  readonly proposal: ChatProposal;
  readonly marketName: string;
  readonly topic: string;
}) {
  const { t } = useT('trading');
  const now = useServerNow(dealTickMs(proposal));
  const phase = dealPhase(proposal, now);
  return (
    <section
      aria-label={t('title', { side: t(`side.${proposal.side}`), market: marketName })}
      data-phase={phase.kind}
      className="flex flex-col gap-4"
    >
      <DealHead proposal={proposal} phase={phase} marketName={marketName} coin={null} />
      {match(phase)
        .with({ kind: 'open' }, () => (
          <DealActions proposal={proposal} marketName={marketName} topic={topic} now={now} size="lg" />
        ))
        .with({ kind: 'expired', revisable: true }, () => <DealRevise proposal={proposal} topic={topic} />)
        .with(
          { kind: 'expired', revisable: false },
          { kind: P.union('confirmed-pending', 'entered', 'closed', 'rejected', 'skipped', 'superseded') },
          () => null,
        )
        .exhaustive()}
    </section>
  );
}
