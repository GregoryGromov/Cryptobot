import type { Side } from '@reinforce/server/dto';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { match } from 'ts-pattern';

export const sideButtonClass = (side: Side): string =>
  match(side)
    .with('LONG', () => 'bg-up/12 font-semibold text-up hover:bg-up/18')
    .with('SHORT', () => 'bg-down/12 font-semibold text-down hover:bg-down/18')
    .exhaustive();

export function SideArrow({ side, className }: { readonly side: Side; readonly className?: string }) {
  const Arrow = side === 'LONG' ? ArrowUpRight : ArrowDownRight;
  return <Arrow aria-hidden strokeWidth={2.4} className={className} />;
}
