import type { MarketStatus } from '@reinforce/server/dto';
import { pageStripClass, pageStripTitleClass } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { CloudOff, Info, LoaderCircle } from 'lucide-react';
import { match } from 'ts-pattern';
import { usePulse } from '~/shared/api/live';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';

export function ShellNotes() {
  const market = usePulse().data?.market;
  const status = useQuery(trpc.views.chats.queryOptions()).data?.status ?? null;
  const marketNote = market && market.phase !== 'ready' ? market : null;
  if (!marketNote && !status) return null;
  return (
    <div className="mx-auto flex w-full max-w-[71rem] flex-col gap-2 px-4 pt-4 md:px-8">
      {marketNote && <MarketNote market={marketNote} />}
      {status && <StatusNote text={status.text} settings={status.settings} />}
    </div>
  );
}

function MarketNote({ market }: { readonly market: MarketStatus }) {
  const { t } = useT('shell');
  const loading = market.phase === 'loading';
  const text = match(market)
    .with({ phase: 'loading' }, ({ loaded, total }) =>
      total > 0 ? t('market.loadingOf', { loaded, total }) : t('market.loading'),
    )
    .with(
      { phase: 'stale' },
      { phase: 'unavailable' },
      { phase: 'ready' },
      ({ message }) => message ?? t('market.stale'),
    )
    .exhaustive();
  return (
    <div role="status" className={pageStripClass}>
      {loading ? (
        <LoaderCircle
          aria-hidden
          strokeWidth={1.75}
          className="text-muted-foreground motion-safe:animate-spin"
        />
      ) : (
        <CloudOff aria-hidden strokeWidth={1.75} className="text-muted-foreground" />
      )}
      <span className={cn(pageStripTitleClass, 'min-w-0 flex-1')}>{text}</span>
    </div>
  );
}

function StatusNote({ text, settings }: { readonly text: string; readonly settings: boolean }) {
  const { t } = useT('common');
  return (
    <div role="status" className={pageStripClass}>
      <Info aria-hidden strokeWidth={1.75} className="text-muted-foreground" />
      <span className={cn(pageStripTitleClass, 'min-w-0 flex-1')}>{text}</span>
      {settings && (
        <Button asChild variant="secondary" size="sm">
          <Link to="/settings">{t('nav.settings')}</Link>
        </Button>
      )}
    </div>
  );
}
