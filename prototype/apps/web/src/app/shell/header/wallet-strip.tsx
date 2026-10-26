import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Crown, Gem, Wallet } from 'lucide-react';
import { useAgentStaked } from '~/contexts/agents/api/agent-store';
import { PremiumBadge } from '~/contexts/agents/ui/premium-badge';
import { HOLDINGS, POINTS } from '~/shared/api/mock/wallet';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { ThemeToggle } from './theme-toggle';

const itemClass =
  'focus-ring hover-neutral-soft flex h-full items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-foreground-soft text-meta transition-colors';

const TOTAL = HOLDINGS.reduce((sum, holding) => sum + holding.usd, 0);

/** The wallet inside the head bar: what the person holds, their points and their Premium Pass. */
export function WalletStrip({ className }: { readonly className?: string }) {
  const { t } = useT('shell');
  const f = useFormatters();
  const staked = useAgentStaked();
  return (
    <nav aria-label={t('agents.label')} className={cn('flex h-full min-w-0 items-center', className)}>
      <Link to="/portfolio" className={itemClass}>
        <Wallet strokeWidth={1.9} className="size-4 text-muted-foreground" />
        <span className="font-medium text-foreground tabular-nums">{f.usd(TOTAL)}</span>
      </Link>
      <Link to="/rewards" className={itemClass}>
        <Gem strokeWidth={1.9} className="size-4 text-(--palette-violet-500)" />
        <span>{t('agents.strip.points')}</span>
        <span className="font-medium text-foreground tabular-nums">{f.int(POINTS)}</span>
      </Link>
      <Link to="/rewards" className={cn(itemClass, 'max-lg:hidden')}>
        {staked ? (
          <PremiumBadge />
        ) : (
          <>
            <Crown strokeWidth={1.9} className="size-4 text-(--palette-violet-500)" />
            <span className="font-medium text-foreground">{t('agents.strip.getPremium')}</span>
          </>
        )}
      </Link>
      <ThemeToggle />
    </nav>
  );
}
