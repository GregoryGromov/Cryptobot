import type { Quote } from '@reinforce/server/dto';
import { Badge } from '@reinforce/ui-react/badge';
import { Button } from '@reinforce/ui-react/button';
import { SkeletonLines } from '@reinforce/ui-react/skeleton';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowLeftRight, Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { HeadBar } from '~/app/shell/header/head-bar';
import { WalletStrip } from '~/app/shell/header/wallet-strip';
import { useShellActions } from '~/app/shell/shell-store';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { tickerOf, topicKind } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { Numeral } from '~/shared/ui/numeral';
import type { HeadView, PositionTag } from '../domain/head-vm';
import { useClosedUntil } from './use-closed-until';

export type HeadState =
  | HeadView
  | { readonly kind: 'blank' }
  | { readonly kind: 'loading'; readonly topic: string };

const titleClass = 'min-w-0 truncate font-semibold text-row';
const soloTitleClass = 'min-w-0 truncate font-semibold text-row';

function Frame({ title, actions }: { readonly title: ReactNode; readonly actions?: ReactNode }) {
  const { t } = useT('conversation');
  const { navigationOpened } = useShellActions();
  return (
    <HeadBar className="before:end-[calc(-1*var(--thread-dock,0px))]">
      <Button asChild variant="ghost" size="icon-md" className="shrink-0 rounded-full">
        <Link to="/" aria-label={t('head.home')}>
          <ArrowLeft aria-hidden />
        </Link>
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-2 md:max-w-[45%] md:flex-initial">{title}</div>
      <span aria-hidden className="ms-2 hidden h-5 w-px shrink-0 bg-foreground/12 md:block" />
      <WalletStrip className="hidden md:flex" />
      {actions && <div className="ms-auto flex shrink-0 items-center">{actions}</div>}
      <Button
        variant="ghost"
        size="icon-md"
        className="ms-auto shrink-0 rounded-full md:hidden"
        aria-label={t('head.menu')}
        onClick={navigationOpened}
      >
        <Menu aria-hidden />
      </Button>
    </HeadBar>
  );
}

function Position({ tag }: { readonly tag: PositionTag }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const side = match(tag.side)
    .with('LONG', () => t('head.position.LONG'))
    .with('SHORT', () => t('head.position.SHORT'))
    .exhaustive();
  return (
    <Badge
      variant="secondary"
      className="motion-safe:fade-in motion-safe:zoom-in-95 shrink-0 gap-1.5 motion-safe:animate-in motion-safe:duration-300"
    >
      <span className="max-sm:sr-only">{side}</span>
      {match(tag)
        .with({ kind: 'open' }, ({ pnl }) =>
          pnl === null ? null : (
            <Numeral tone="direction" direction={directionOf(pnl, 2)}>
              {f.usdSigned(pnl)}
            </Numeral>
          ),
        )
        .with({ kind: 'entering' }, () => <span>{t('head.entering')}</span>)
        .exhaustive()}
    </Badge>
  );
}

function MarketTitle({
  market,
  onOpenLatest,
}: {
  readonly market: Quote;
  readonly onOpenLatest: (() => void) | null;
}) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const closed = useClosedUntil(market.coin);
  return (
    <>
      <CoinLogo coin={market.coin} ticker={market.ticker} size="sm" />
      <h1 className={titleClass}>
        {onOpenLatest ? (
          <button
            type="button"
            title={t('head.latest')}
            onClick={onOpenLatest}
            className="focus-ring rounded-sm"
          >
            {market.name}
          </button>
        ) : (
          market.name
        )}
      </h1>
      <span className="flex shrink-0 items-baseline gap-1.5 text-meta">
        <Numeral tone="foreground">{market.price === null ? '—' : f.price(market.price)}</Numeral>
        {closed ? (
          <span title={t('head.closedUntil', { when: closed })} className="text-muted-foreground">
            {t('head.closed')}
          </span>
        ) : (
          market.change1h !== null && (
            <>
              <Numeral tone="direction" direction={directionOf(market.change1h, 2)}>
                {f.change(market.change1h, 2)}
              </Numeral>
              <span className="text-muted-foreground max-sm:hidden">{t('head.hour')}</span>
            </>
          )
        )}
      </span>
    </>
  );
}

function LoadingTitle({ topic }: { readonly topic: string }) {
  const { t } = useT('conversation');
  return match(topicKind(topic))
    .with({ kind: 'general' }, () => <h1 className={soloTitleClass}>{t('head.general')}</h1>)
    .with({ kind: 'talk' }, () => (
      <h1 className={soloTitleClass}>
        <SkeletonLines>{t('head.newTalk')}</SkeletonLines>
      </h1>
    ))
    .with({ kind: 'market' }, ({ market }) => (
      <>
        <CoinLogo coin={market} ticker={tickerOf(market)} size="sm" />
        <h1 className={titleClass}>{tickerOf(market)}</h1>
      </>
    ))
    .exhaustive();
}

export function ConversationHead({
  state,
  onOpenLatest = null,
  onTrade = null,
  trading = false,
}: {
  readonly state: HeadState;
  readonly onOpenLatest?: (() => void) | null;
  readonly onTrade?: (() => void) | null;
  readonly trading?: boolean;
}) {
  const { t } = useT('conversation');
  return match(state)
    .with({ kind: 'blank' }, () => <Frame title={null} />)
    .with({ kind: 'loading' }, ({ topic }) => <Frame title={<LoadingTitle topic={topic} />} />)
    .with({ kind: 'general' }, () => (
      <Frame title={<h1 className={soloTitleClass}>{t('head.general')}</h1>} />
    ))
    .with({ kind: 'talk' }, ({ title }) => (
      <Frame title={<h1 className={soloTitleClass}>{title ?? t('head.newTalk')}</h1>} />
    ))
    .with({ kind: 'market' }, ({ market, position, trade }) => (
      <Frame
        title={
          <>
            <MarketTitle market={market} onOpenLatest={onOpenLatest} />
            {position && <Position tag={position} />}
          </>
        }
        actions={
          trade &&
          onTrade && (
            <Button
              variant="secondary"
              size="sm"
              aria-pressed={trading}
              className="motion-safe:fade-in motion-safe:zoom-in-95 shrink-0 rounded-full aria-pressed:border-foreground/30 aria-pressed:bg-foreground/12 motion-safe:animate-in motion-safe:duration-300"
              onClick={onTrade}
            >
              <ArrowLeftRight aria-hidden />
              <span className="max-sm:sr-only">{t('head.trade')}</span>
            </Button>
          )
        }
      />
    ))
    .exhaustive();
}
