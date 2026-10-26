export const tableContainerClass = 'glass corner-squircle relative w-full overflow-x-auto rounded-2xl';

export const tableViewportClass = 'relative w-full overflow-auto overscroll-contain';

export const tableClass = 'w-full caption-bottom text-sm';

export const tableHeaderClass = '[&_tr]:border-b';

export const tableBodyClass = '[&_tr:last-child]:border-0';

export const tableRowClass = 'hover-glass-tint border-b data-[state=selected]:bg-primary/15';

export const tableHeadClass =
  'h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-muted-foreground text-xs [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]';

export const tableCellClass =
  'whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]';
