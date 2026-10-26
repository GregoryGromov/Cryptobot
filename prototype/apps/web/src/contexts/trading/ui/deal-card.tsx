import type { ChatProposal } from '@reinforce/server/dto';
import { Card } from '@reinforce/ui-react/card';
import { match, P } from 'ts-pattern';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useServerNow } from '~/shared/api/live';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { tickerOf, topicKind } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import { type DealPhase, dealLevels, dealPhase } from '../domain/deal-phase';
import { type TradeResult, tradeResult, tradeStatusText } from '../domain/trade-status';
import { DealActions } from './deal-actions';
import { DealLive } from './deal-live';
import { DealRevise } from './deal-revise';
import { DealScale } from './deal-scale';
import { DealTerms } from './deal-terms';

const LIVE_TICK = 1_000;
const QUIET_TICK = 60_000;

export const dealTickMs = (proposal: ChatProposal): number =>
  proposal.status === 'open' && proposal.latest ? LIVE_TICK : QUIET_TICK;

const coinOf = (proposal: ChatProposal, topic: string): string | null =>
  proposal.trade?.coin ??
  match(topicKind(topic))
    .with({ kind: 'market' }, ({ market }) => market)
    .with({ kind: P.union('general', 'talk') }, () => null)
    .exhaustive();

export function DealCard({
  proposal,
  marketName,
  topic,
}: {
  readonly proposal: ChatProposal;
  readonly marketName: string;
  readonly topic: string;
}) {
  const now = useServerNow(dealTickMs(proposal));
  const phase = dealPhase(proposal, now);
  const levels = dealLevels(phase);
  return (
    <Card size="sm" data-phase={phase.kind} className="gap-3.5 px-4">
      <DealHead proposal={proposal} phase={phase} marketName={marketName} coin={coinOf(proposal, topic)} />
      {levels !== null && (
        <DealScale
          levels={levels}
          estimate={phase.kind === 'open' ? phase.estimate : null}
          settled={phase.kind === 'closed'}
        />
      )}
      {match(phase)
        .with({ kind: 'open' }, ({ estimate }) => (
          <>
            {estimate !== null && <DealTerms proposal={proposal} estimate={estimate} />}
            <DealActions proposal={proposal} marketName={marketName} topic={topic} now={now} />
          </>
        ))
        .with({ kind: P.union('entered', 'closed') }, ({ trade }) => (
          <DealLive trade={trade} market={marketName} />
        ))
        .with({ kind: 'expired', revisable: true }, () => <DealRevise proposal={proposal} topic={topic} />)
        .with(
          { kind: 'expired', revisable: false },
          { kind: P.union('confirmed-pending', 'rejected', 'skipped', 'superseded') },
          () => null,
        )
        .exhaustive()}
    </Card>
  );
}

export function DealHead({
  proposal,
  phase,
  marketName,
  coin,
}: {
  readonly proposal: ChatProposal;
  readonly phase: DealPhase;
  readonly marketName: string;
  readonly coin: string | null;
}) {
  const { t } = useT('trading');
  const { t: tf } = useT('format');
  const fmt = useFormatters();
  const words = { t, clock: fmt.clock };
  const line = match(phase)
    .with({ kind: 'open' }, () => t('deal.offer', { horizon: horizonWords(tf, proposal.horizon) }))
    .with({ kind: 'confirmed-pending', trade: null }, () => t('deal.pending'))
    .with({ kind: 'confirmed-pending', trade: P.nonNullable }, ({ trade }) => tradeStatusText(words, trade))
    .with({ kind: 'entered' }, ({ trade }) =>
      t('deal.opened', { time: fmt.clock(trade.entry.at), amount: fmt.usd(trade.notional) }),
    )
    .with({ kind: P.union('closed', 'rejected') }, ({ trade }) => tradeStatusText(words, trade))
    .with({ kind: 'skipped' }, () => t('deal.skipped'))
    .with({ kind: 'expired' }, ({ revisable }) => (revisable ? t('deal.stale') : t('deal.expired')))
    .with({ kind: 'superseded' }, () => t('deal.superseded'))
    .exhaustive();
  const quiet = phase.kind === 'skipped' || phase.kind === 'expired' || phase.kind === 'superseded';
  return (
    <div className="flex items-center gap-3">
      {coin !== null && <CoinLogo coin={coin} ticker={tickerOf(coin)} size="md" />}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-semibold text-foreground text-row">
          {t('title', { side: t(`side.${proposal.side}`), market: marketName })}
        </p>
        <p className="text-meta text-muted-foreground">{line}</p>
      </div>
      <DealFigure proposal={proposal} phase={phase} quiet={quiet} />
    </div>
  );
}

function DealFigure({
  proposal,
  phase,
  quiet,
}: {
  readonly proposal: ChatProposal;
  readonly phase: DealPhase;
  readonly quiet: boolean;
}) {
  const fmt = useFormatters();
  const result = match(phase)
    .with({ kind: P.union('entered', 'closed') }, ({ trade }) => tradeResult(trade))
    .with(
      { kind: P.union('open', 'confirmed-pending', 'rejected', 'skipped', 'expired', 'superseded') },
      (): TradeResult => ({ kind: 'none' }),
    )
    .exhaustive();
  return match(result)
    .with({ kind: 'pnl' }, ({ pnl }) => (
      <Numeral tone="direction" direction={directionOf(pnl, 2)} weight="semibold" className="text-row">
        {fmt.usdSigned(pnl)}
      </Numeral>
    ))
    .with({ kind: P.union('none', 'unvalued') }, () => (
      <Numeral tone={quiet ? 'muted' : 'foreground'} weight="semibold" className="text-row">
        {fmt.usd(proposal.sizeUsd)}
      </Numeral>
    ))
    .exhaustive();
}
