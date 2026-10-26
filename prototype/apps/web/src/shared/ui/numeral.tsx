import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import type { Direction } from '~/shared/format/percent';

export type NumeralTone = 'inherit' | 'foreground' | 'muted' | 'direction';
export type NumeralSize = 'xs' | 'sm' | 'md';
export type NumeralWeight = 'normal' | 'medium' | 'semibold';

const TONE: Record<Exclude<NumeralTone, 'direction'>, string> = {
  inherit: '',
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
};
const DIRECTION: Record<Direction, string> = {
  up: 'text-up',
  down: 'text-down',
  flat: 'text-muted-foreground',
};
const SIZE: Record<NumeralSize, string> = { xs: 'text-xs', sm: 'text-sm', md: '' };
const WEIGHT: Record<NumeralWeight, string> = {
  normal: '',
  medium: 'font-medium',
  semibold: 'font-semibold',
};

export function Numeral({
  children,
  tone = 'inherit',
  direction = 'flat',
  size = 'md',
  weight = 'normal',
  className,
}: {
  readonly children: ReactNode;
  readonly tone?: NumeralTone;
  readonly direction?: Direction;
  readonly size?: NumeralSize;
  readonly weight?: NumeralWeight;
  readonly className?: string;
}) {
  return (
    <span
      className={cn(
        'font-figure',
        tone === 'direction' ? DIRECTION[direction] : TONE[tone],
        SIZE[size],
        WEIGHT[weight],
        className,
      )}
    >
      {children}
    </span>
  );
}
