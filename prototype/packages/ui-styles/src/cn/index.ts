import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['meta', 'row'] } },
});

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export type { ClassValue } from 'clsx';
