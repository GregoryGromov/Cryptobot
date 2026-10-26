import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { ArrowDown } from 'lucide-react';
import { useT } from '~/shared/i18n';

export function ToEnd({
  shown,
  fresh,
  onClick,
}: {
  readonly shown: boolean;
  readonly fresh: number;
  readonly onClick: () => void;
}) {
  const { t } = useT('conversation');
  return (
    <div
      inert={!shown}
      className={cn(
        'absolute -top-14 left-1/2 -translate-x-1/2 transition-opacity duration-200 motion-reduce:transition-none',
        shown ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <span className="glass-strong relative flex rounded-full">
        <Button
          type="button"
          variant="secondary"
          size="icon-md"
          aria-label={fresh > 0 ? t('toEndFresh', { count: fresh }) : t('toEnd')}
          onClick={onClick}
        >
          <ArrowDown aria-hidden />
        </Button>
        {fresh > 0 && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 font-figure font-semibold text-[0.6875rem] text-background"
          >
            {fresh}
          </span>
        )}
      </span>
    </div>
  );
}
