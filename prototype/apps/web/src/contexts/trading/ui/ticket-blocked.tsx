import { Button } from '@reinforce/ui-react/button';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { Link } from '@tanstack/react-router';
import { Info } from 'lucide-react';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';

export function TicketBlocked({
  reason,
  minUsd,
}: {
  readonly reason: 'account-busy' | 'capital';
  readonly minUsd: number;
}) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  return (
    <div className="flex flex-col gap-3">
      <InlineNote tone="neutral" icon={Info} role="status">
        {match(reason)
          .with('account-busy', () => t('ticket.blocked.account-busy'))
          .with('capital', () => t('ticket.blocked.capital', { min: fmt.usd(minUsd) }))
          .exhaustive()}
      </InlineNote>
      <Button asChild variant="secondary" className="self-start">
        <Link to="/portfolio" search={{ book: 'user' }}>
          {t('ticket.portfolio')}
        </Link>
      </Button>
    </div>
  );
}
