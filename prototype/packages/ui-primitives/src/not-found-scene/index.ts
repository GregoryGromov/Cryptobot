import { cva } from 'class-variance-authority';

export const notFoundFigureVariants = cva('select-none [perspective:1000px]', {
  variants: {
    size: {
      hero: '[font-size:clamp(4.5rem,16vw,12rem)]',
      compact: '[font-size:clamp(4.5rem,8vw,6rem)]',
    },
  },
  defaultVariants: { size: 'hero' },
});

export const notFoundPlaneClass =
  'flex items-center justify-center gap-[0.1em] will-change-transform [transform-style:preserve-3d]';

export const notFoundDigitClass = 'nfs-digit font-bold leading-none tracking-tight text-primary';

export const notFoundMarkClass = 'relative h-[0.82em] w-[0.82em] text-primary [transform:translateZ(0.06em)]';

export const notFoundMarkCanvasClass = 'absolute inset-0 h-full w-full';

export const notFoundMarkFallbackClass = 'absolute inset-0 h-full w-full';
