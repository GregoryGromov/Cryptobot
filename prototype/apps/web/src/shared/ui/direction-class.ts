import { match } from 'ts-pattern';
import type { Direction } from '~/shared/format/percent';

export const directionClass = (direction: Direction): string =>
  match(direction)
    .with('up', () => 'text-up')
    .with('down', () => 'text-down')
    .with('flat', () => 'text-muted-foreground')
    .exhaustive();
