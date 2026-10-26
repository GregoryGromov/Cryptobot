import { cva } from 'class-variance-authority';

export const sheetOverlayClass =
  'fixed inset-0 z-50 bg-overlay supports-[backdrop-filter]:backdrop-blur-[3px] duration-[var(--motion-duration-standard)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0';

export const sheetContentVariants = cva(
  'glass-overlay fixed z-50 flex flex-col gap-4 overscroll-contain data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-[var(--motion-duration-standard)] data-[state=open]:duration-[var(--motion-duration-elevated)] data-[state=closed]:ease-[var(--motion-ease-standard)] data-[state=open]:ease-[var(--motion-ease-emphasized)]',
  {
    variants: {
      side: {
        top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto pt-[env(safe-area-inset-top)]',
        right:
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:max-w-sm',
        bottom:
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto pb-[env(safe-area-inset-bottom)]',
        left: 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

export const sheetPanelClass =
  'gap-0 data-[side=right]:w-full data-[side=right]:max-w-md data-[side=bottom]:max-h-[92svh] data-[side=bottom]:rounded-t-2xl';

export const sheetCloseClass =
  'focus-ring disabled-state absolute top-4 right-4 rounded-md opacity-70 transition-opacity hover:opacity-100 data-[state=open]:bg-secondary';

export const sheetTitleClass = 'font-semibold text-foreground';

export const sheetDescriptionClass = 'text-sm text-muted-foreground';

export const sheetBarClass = 'flex items-center gap-2 border-foreground/7 border-b pt-4.5 pe-4 pb-3.5 ps-5';

export const sheetBarTitleClass =
  'min-w-0 flex-1 truncate font-semibold text-[1.0625rem] text-foreground leading-6 tracking-[-0.01em]';

export const sheetBarActionClass = 'size-8.5 text-foreground-soft [&_svg]:size-[1.0625rem]';

export const sheetBarDescriptionClass = 'px-5 pt-3 text-muted-foreground text-sm';
