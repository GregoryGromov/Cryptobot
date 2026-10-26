import { cardVariants } from '@reinforce/ui-primitives/card';
import { cn } from '@reinforce/ui-styles/cn';

export const HEAD_CLASS = cn(
  cardVariants({ size: 'sm' }),
  'flex-row flex-wrap items-center gap-x-7 gap-y-3 px-3 py-3 sm:px-4',
);

export const TERMINAL_GRID_CLASS = 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]';

export const CHART_PANEL_CLASS = cn(
  cardVariants({ size: 'sm' }),
  'h-[25rem] px-2.5 pt-2.5 pb-2 sm:px-3.5 sm:pt-3.5 lg:h-[max(30rem,calc(100dvh-14.5rem))]',
);

export const PANEL_CLASS = cn(cardVariants({ size: 'sm' }), 'min-w-0 gap-3 px-4');

export const SIDE_PANEL_CLASS = cn(PANEL_CLASS, 'gap-6 lg:h-0 lg:min-h-full');

export const SIDE_ROW_CLASS = 'flex items-center justify-between gap-3 py-1 text-meta';

export const PANEL_HEAD_CLASS = 'flex min-h-6 items-baseline justify-between gap-3';

export const PANEL_TITLE_CLASS = 'font-medium text-foreground text-meta';
