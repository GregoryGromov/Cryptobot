import { cn } from '@reinforce/ui-styles/cn';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BriefcaseBusiness,
  ChartCandlestick,
  type LucideIcon,
  Settings2,
  SquarePen,
  Trophy,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { LeaderboardPlace } from '~/contexts/leaderboard/ui/leaderboard-pill';
import { useServerNow } from '~/shared/api/live';
import { useSession } from '~/shared/api/session';
import { trpc } from '~/shared/api/trpc';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import {
  railFadeClass,
  railIconClass,
  railLabelClass,
  railRowClass,
  railSlotClass,
  unreadDotClass,
} from './rail';
import { RailTip } from './rail-tip';

type SectionKey = 'signals' | 'markets' | 'portfolio' | 'leaderboard' | 'settings';

type SectionRow = {
  readonly to: '/signals' | '/markets' | '/portfolio' | '/leaderboard' | '/settings';
  readonly key: SectionKey;
  readonly icon: LucideIcon;
};

const SECTION_ROWS: readonly SectionRow[] = [
  { to: '/signals', key: 'signals', icon: Zap },
  { to: '/markets', key: 'markets', icon: ChartCandlestick },
  { to: '/portfolio', key: 'portfolio', icon: BriefcaseBusiness },
  { to: '/leaderboard', key: 'leaderboard', icon: Trophy },
  { to: '/settings', key: 'settings', icon: Settings2 },
];

const FRESH_SIGNAL_MS = 15 * 60_000;

export function NewTalkRow({
  expanded,
  onNavigate,
}: {
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('shell');
  return (
    <RailTip label={t('newTalk')} enabled={!expanded}>
      <Link
        to="/"
        activeOptions={{ exact: true, includeSearch: false }}
        onClick={onNavigate}
        className={cn(railRowClass(expanded), 'font-medium text-foreground')}
      >
        <span className={railSlotClass(expanded)}>
          <SquarePen strokeWidth={1.75} className="size-4.5 text-foreground" />
        </span>
        <span className={railLabelClass(expanded)}>{t('newTalk')}</span>
      </Link>
    </RailTip>
  );
}

export function NavSections({
  expanded,
  onNavigate,
}: {
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
}) {
  const { t } = useT('common');
  return (
    <nav aria-label={t('nav.label')} className="flex flex-col gap-0.5">
      {SECTION_ROWS.map((row) => (
        <SectionLink
          key={row.key}
          row={row}
          expanded={expanded}
          onNavigate={onNavigate}
          mark={row.key === 'signals' && <FreshSignalMark />}
          trailing={match(row.key)
            .with('portfolio', () => <BalanceFigure expanded={expanded} />)
            .with('leaderboard', () => <PlaceFigure expanded={expanded} />)
            .otherwise(() => null)}
        />
      ))}
    </nav>
  );
}

function SectionLink({
  row,
  expanded,
  onNavigate,
  mark,
  trailing,
}: {
  readonly row: SectionRow;
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
  readonly mark: ReactNode;
  readonly trailing: ReactNode;
}) {
  const { t } = useT('common');
  const Icon = row.icon;
  const label = t(`nav.${row.key}`);
  return (
    <RailTip label={label} enabled={!expanded}>
      <Link
        to={row.to}
        activeOptions={{ includeSearch: false }}
        onClick={onNavigate}
        className={railRowClass(expanded)}
      >
        <span className={railSlotClass(expanded)}>
          <span className="relative">
            <Icon strokeWidth={1.75} className={railIconClass} />
            {mark}
          </span>
        </span>
        <span className={railLabelClass(expanded)}>{label}</span>
        {trailing}
      </Link>
    </RailTip>
  );
}

function FreshSignalMark() {
  const { t } = useT('shell');
  const chats = useQuery(trpc.views.chats.queryOptions());
  const now = useServerNow(30_000);
  const at = chats.data?.lastSignalAt ?? null;
  if (at === null || now - at > FRESH_SIGNAL_MS) return null;
  return (
    <>
      <span aria-hidden className={unreadDotClass} />
      <span className="sr-only">{t('side.fresh')}</span>
    </>
  );
}

function BalanceFigure({ expanded }: { readonly expanded: boolean }) {
  const { t } = useT('shell');
  const fmt = useFormatters();
  const nav = useSession().data?.balance.nav ?? null;
  if (nav === null) return null;
  const figure = fmt.usd(nav);
  return (
    <span className={cn(railFadeClass(expanded), 'ms-2 shrink-0')}>
      <span aria-hidden className="font-figure text-muted-foreground text-xs">
        {figure}
      </span>
      <span className="sr-only">{t('side.balance', { nav: figure })}</span>
    </span>
  );
}

function PlaceFigure({ expanded }: { readonly expanded: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(railFadeClass(expanded), 'ms-2 shrink-0 font-figure text-muted-foreground text-xs')}
    >
      <LeaderboardPlace />
    </span>
  );
}
