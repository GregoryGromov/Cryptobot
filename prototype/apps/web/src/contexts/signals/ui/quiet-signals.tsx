import type { Signals } from '@reinforce/server/dto';
import { cardVariants } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Radar } from 'lucide-react';
import type { ReactNode } from 'react';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { Trans, useLocale, useT } from '~/shared/i18n';
import { inSentence } from '~/shared/i18n/in-sentence';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { directionClass } from '~/shared/ui/direction-class';

type Quiet = NonNullable<Signals['quiet']>;

export function SignalNote({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note: string;
  readonly children?: ReactNode;
}) {
  return (
    <section aria-label={title} className={cn(cardVariants({ size: 'sm' }), 'gap-2 px-4')}>
      <p className="flex items-center gap-2 font-medium text-foreground text-row">
        <Radar aria-hidden className="size-4 text-muted-foreground" strokeWidth={2} />
        {title}
      </p>
      <p className="text-foreground-soft text-sm">{note}</p>
      {children}
    </section>
  );
}

export function QuietSignals({ quiet }: { readonly quiet: Quiet }) {
  const { t } = useT('signals');
  return (
    <SignalNote
      title={t('none.title')}
      note={quiet.loading ? t('none.loading') : t('none.quiet', { count: quiet.markets })}
    >
      {quiet.movers[0] && <TopMover top={quiet.movers[0]} />}
    </SignalNote>
  );
}

function TopMover({ top }: { readonly top: Quiet['movers'][number] }) {
  const { t } = useT('signals');
  const fmt = useFormatters();
  const locale = useLocale();
  return (
    <Link
      {...topicLink(top.chat)}
      className="focus-ring hover-neutral-soft -mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-1.5 text-foreground text-sm transition-colors"
    >
      <CoinLogo coin={top.coin} ticker={top.ticker} size="sm" />
      <span>
        <Trans
          t={t}
          i18nKey="top"
          values={{ name: inSentence(top.name, locale), change: fmt.change(top.change1h, 1) }}
          components={{
            move: <span className={cn('font-figure', directionClass(directionOf(top.change1h, 1)))} />,
          }}
        />
      </span>
    </Link>
  );
}
