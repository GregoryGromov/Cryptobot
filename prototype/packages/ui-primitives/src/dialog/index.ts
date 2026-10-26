import { cva, type VariantProps } from 'class-variance-authority';

export const dialogOverlayClass =
  'fixed inset-0 z-50 bg-overlay supports-[backdrop-filter]:backdrop-blur-[3px] duration-[var(--motion-duration-standard)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0';

export const dialogContentVariants = cva(
  'glass-overlay corner-squircle data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 overscroll-contain rounded-2xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-[var(--motion-duration-quick)] data-[state=open]:duration-[var(--motion-duration-elevated)] data-[state=open]:ease-[var(--motion-ease-emphasized)]',
  {
    variants: {
      size: {
        sm: 'max-w-[calc(100%-2rem)] p-4 sm:max-w-sm [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4',
        default:
          'max-w-[calc(100%-2rem)] p-6 sm:max-w-lg [&>[data-slot=dialog-close]]:top-6 [&>[data-slot=dialog-close]]:right-6',
        lg: 'max-w-[calc(100%-2rem)] p-8 sm:max-w-2xl [&>[data-slot=dialog-close]]:top-8 [&>[data-slot=dialog-close]]:right-8',
        xl: 'max-w-[calc(100%-2rem)] p-6 sm:max-w-4xl [&>[data-slot=dialog-close]]:top-6 [&>[data-slot=dialog-close]]:right-6',
      },
    },
    defaultVariants: { size: 'default' },
  },
);

export type DialogContentVariants = VariantProps<typeof dialogContentVariants>;

export const dialogCloseClass =
  "focus-ring disabled-state absolute rounded-md opacity-70 transition-opacity hover:opacity-100 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

export const dialogHeaderClass = 'flex flex-col gap-2 text-center sm:text-left';

export const dialogTitleClass = 'text-lg leading-snug font-semibold';

export const dialogDescriptionClass = 'text-sm text-muted-foreground';
