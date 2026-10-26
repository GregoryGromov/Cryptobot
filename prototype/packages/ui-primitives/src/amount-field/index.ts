// Flat inset inside the op card (never a second glass layer); the input inside stays naked.
export const amountFieldShellClass =
  'group/amount-shell flex cursor-text items-center gap-2 rounded-(--radius-control) border border-border-control bg-input-bg px-3 py-2 transition-[border-color,box-shadow] duration-(--motion-duration-quick) motion-reduce:transition-none hover:border-foreground/60 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25 has-[[aria-invalid=true]]:border-destructive';

// Input fills the row so the coin chip after it pins to the right edge; long values scroll inside the field, the chip never moves.
export const amountFieldClass =
  'w-full min-w-0 appearance-none border-0 bg-transparent p-0 font-figure font-semibold text-3xl text-foreground caret-primary tracking-tight outline-none placeholder:text-muted-foreground/40 placeholder:transition-colors placeholder:duration-(--motion-duration-quick) group-hover/amount-shell:placeholder:text-muted-foreground/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export const inlineAmountShellClass =
  'group/inline-amount inline-flex w-fit shrink-0 cursor-text items-baseline gap-0.5 rounded-md bg-primary/8 px-2.5 py-1.5 ring-1 ring-primary/25 ring-inset transition-[background-color,box-shadow] duration-(--motion-duration-quick) hover:bg-primary/14 hover:ring-primary/40 focus-within:bg-primary/14 focus-within:ring-2 focus-within:ring-primary/55';

export const inlineAmountFieldClass =
  'min-w-[2ch] shrink-0 appearance-none border-0 bg-transparent p-0 text-start font-figure font-semibold text-foreground caret-primary tracking-tight outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export const inlineAmountAffixClass =
  'font-figure font-semibold text-muted-foreground transition-colors duration-(--motion-duration-quick) group-focus-within/inline-amount:text-primary';
