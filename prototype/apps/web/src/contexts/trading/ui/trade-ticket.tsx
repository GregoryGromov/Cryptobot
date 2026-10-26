import type { Chat } from '@reinforce/server/dto';
import {
  sheetBarActionClass,
  sheetBarClass,
  sheetBarDescriptionClass,
  sheetBarTitleClass,
  sheetPanelClass,
} from '@reinforce/ui-primitives/sheet';
import { Button } from '@reinforce/ui-react/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@reinforce/ui-react/sheet';
import { cn } from '@reinforce/ui-styles/cn';
import { XIcon } from 'lucide-react';
import { useId } from 'react';
import { useT } from '~/shared/i18n';
import { TicketForm } from './ticket-form';

const dockClass =
  'glass-island glass-lift motion-safe:fade-in sticky top-[max(1rem,env(safe-area-inset-top))] z-30 mt-[max(1rem,env(safe-area-inset-top))] me-[max(1rem,env(safe-area-inset-right))] mb-[max(1rem,env(safe-area-inset-bottom))] flex h-[calc(100svh-max(1rem,env(safe-area-inset-top))-max(1rem,env(safe-area-inset-bottom)))] w-88 shrink-0 flex-col self-start overflow-hidden rounded-(--radius-stage) motion-safe:animate-in motion-safe:duration-200';

export const tradeDockRoomClass = '[--thread-dock:calc(22rem+max(1rem,env(safe-area-inset-right)))]';

export function TradeTicket({
  chat,
  open,
  onOpenChange,
  docked = false,
}: {
  readonly chat: Chat;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly docked?: boolean;
}) {
  const { t } = useT('trading');
  const { t: tc } = useT('common');
  const titleId = useId();
  const market = chat.market;
  const limits = chat.ticket;
  if (market === null || limits === null) return null;
  const title = t('ticket.title', { market: market.name });
  const form = (
    <TicketForm topic={chat.key} market={market} limits={limits} onOrdered={() => onOpenChange(false)} />
  );
  if (docked) {
    if (!open) return null;
    return (
      <aside aria-labelledby={titleId} className={dockClass}>
        <div className={sheetBarClass}>
          <h2 id={titleId} className={sheetBarTitleClass}>
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={tc('close')}
            className={sheetBarActionClass}
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
          </Button>
        </div>
        <p className={sheetBarDescriptionClass}>{t('ticket.about')}</p>
        {form}
      </aside>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        closeButton={false}
        className={cn(sheetPanelClass, 'mx-auto max-w-lg data-[side=bottom]:max-h-[95svh]')}
      >
        <div className={sheetBarClass}>
          <SheetTitle className={sheetBarTitleClass}>{title}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label={tc('close')} className={sheetBarActionClass}>
              <XIcon />
            </Button>
          </SheetClose>
        </div>
        <SheetDescription className={sheetBarDescriptionClass}>{t('ticket.about')}</SheetDescription>
        {form}
      </SheetContent>
    </Sheet>
  );
}
