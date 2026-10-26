import { cva, type VariantProps } from 'class-variance-authority';

// SHAPE (ring/filled/check/cross, ui-react) carries the state without relying on color; colour is the redundant second channel.
export const statusDotVariants = cva(
  'inline-grid shrink-0 place-items-center rounded-full [&_svg]:size-full',
  {
    variants: {
      state: {
        working: 'text-primary',
        'needs-you': 'text-warning',
        attention: 'text-warning',
        done: 'text-success',
        failed: 'text-destructive',
      },
      size: {
        default: 'size-2.5',
        lg: 'size-3.5',
      },
      pulse: {
        true: 'motion-safe:animate-[status-dot-pulse_1.6s_ease-in-out_infinite]',
        false: '',
      },
    },
    defaultVariants: {
      state: 'working',
      size: 'default',
      pulse: false,
    },
  },
);

export type StatusDotState = 'working' | 'needs-you' | 'attention' | 'done' | 'failed';
export type StatusDotVariants = VariantProps<typeof statusDotVariants>;
