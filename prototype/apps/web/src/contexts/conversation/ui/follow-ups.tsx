import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { ChartSpline } from 'lucide-react';
import { useState } from 'react';
import { useT } from '~/shared/i18n';
import type { Hint } from '../domain/prompts';
import { enterClass } from './feed-classes';

export function FollowUps({
  hints,
  arriving,
  onAsk,
  className,
}: {
  readonly hints: readonly Hint[];
  readonly arriving: boolean;
  readonly onAsk: (hint: Hint) => Promise<void>;
  readonly className?: string;
}) {
  const { t } = useT('conversation');
  const [asking, setAsking] = useState<string | null>(null);
  const ask = (hint: Hint) => {
    setAsking(hint.text);
    void onAsk(hint)
      .catch(() => undefined)
      .finally(() => setAsking(null));
  };
  return (
    <fieldset
      aria-label={t('next.label')}
      className={cn(
        '-mx-4 mt-4 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0',
        arriving && enterClass,
        className,
      )}
    >
      {hints.map((hint) => (
        <Button
          key={hint.text}
          variant="secondary"
          size="sm"
          disabled={asking !== null && asking !== hint.text}
          loading={asking === hint.text}
          onClick={() => ask(hint)}
        >
          {hint.analyze && <ChartSpline aria-hidden />}
          {hint.text}
        </Button>
      ))}
    </fieldset>
  );
}
