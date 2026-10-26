import { inlineNoteTextVariants, inlineNoteVariants } from '@reinforce/ui-primitives/inline-note';
import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { TriangleAlert } from 'lucide-react';
import { useT } from '~/shared/i18n';

export function DraftConflict({
  onKeep,
  onReset,
}: {
  readonly onKeep: () => void;
  readonly onReset: () => void;
}) {
  const { t } = useT('broker');
  return (
    <div
      role="status"
      className={cn(inlineNoteVariants({ tone: 'warning' }), 'flex-col gap-3 sm:flex-row sm:items-center')}
    >
      <span className="flex flex-1 items-start gap-2.5">
        <TriangleAlert aria-hidden className="mt-px size-4 shrink-0 text-tone-fg" />
        <span className={inlineNoteTextVariants()}>{t('instructions.conflict')}</span>
      </span>
      <span className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={onKeep}>
          {t('instructions.keep')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset}>
          {t('instructions.reset')}
        </Button>
      </span>
    </div>
  );
}
