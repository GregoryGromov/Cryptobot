import {
  sheetBarActionClass,
  sheetBarClass,
  sheetBarTitleClass,
  sheetPanelClass,
} from '@reinforce/ui-primitives/sheet';
import { Button } from '@reinforce/ui-react/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@reinforce/ui-react/sheet';
import { cn } from '@reinforce/ui-styles/cn';
import { XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '~/shared/i18n';

/** The chart over the conversation where there is no room beside it. */
export function ChartSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const { t } = useT('markets');
  const { t: tc } = useT('common');
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        closeButton={false}
        className={cn(sheetPanelClass, 'mx-auto max-w-3xl data-[side=bottom]:max-h-[92svh]')}
      >
        <div className={sheetBarClass}>
          <SheetTitle className={sheetBarTitleClass}>{t('chart.label', { name: title })}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label={tc('close')} className={sheetBarActionClass}>
              <XIcon />
            </Button>
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">{t('chart.selectHint')}</SheetDescription>
        <div className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
