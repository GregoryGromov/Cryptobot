export const commandPaletteContentClass = 'gap-3 p-3 sm:max-w-xl';

export const commandRootClass = 'flex flex-col gap-3 overflow-hidden';

export const commandInputWrapperClass =
  'flex items-center gap-3 border-border/50 border-b px-1 pt-1 pb-3 transition-[border-color] duration-[var(--motion-duration-quick)] focus-within:border-border';

export const commandInputIconClass = 'size-[1.125rem] shrink-0 text-muted-foreground/80';

export const commandInputClass =
  'flex-1 border-0 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50';

export const commandInputHintClass =
  'inline-flex shrink-0 items-center text-muted-foreground/70 pointer-coarse:hidden';

export const commandListClass = 'flex max-h-[26rem] flex-col overflow-y-auto pb-1 [scrollbar-gutter:stable]';

export const commandGroupClass = 'flex flex-col gap-0.5 pt-3 first:pt-0';

export const commandGroupHeadingClass =
  'sticky top-0 z-10 bg-[var(--popover)] px-2 pt-1 pb-1.5 font-medium text-[0.6875rem] text-muted-foreground/80 uppercase tracking-[0.14em]';

export const commandItemClass =
  'relative flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-foreground text-sm outline-none transition-colors duration-[var(--motion-duration-quick)] before:absolute before:top-1/2 before:left-0 before:h-5 before:w-[2px] before:-translate-y-1/2 before:rounded-r-full before:bg-transparent before:transition-colors data-[active=true]:bg-foreground/6 data-[active=true]:before:bg-primary [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground data-[active=true]:[&>svg]:text-foreground';

export const commandItemLabelClass = 'flex min-w-0 flex-1 flex-col gap-0.5';

export const commandItemTitleClass = 'truncate text-[0.9375rem]';

export const commandItemSubtitleClass = 'truncate text-muted-foreground/80 text-xs';

export const commandEmptyClass =
  'flex flex-col items-center justify-center gap-1.5 py-10 text-muted-foreground text-sm';
