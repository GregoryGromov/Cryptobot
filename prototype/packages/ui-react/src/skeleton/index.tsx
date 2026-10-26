import {
  type SkeletonLinesVariants,
  skeletonClass,
  skeletonLinesVariants,
} from '@reinforce/ui-primitives/skeleton';
import { cn } from '@reinforce/ui-styles/cn';
import * as React from 'react';

// Mount-time phase anchor: -(now % breath period) aligns this breath with every other skeleton's
// (see .skeleton-block). 2400 = one full 1.2s alternate cycle of skeleton-breathe in effects.css.
function useSkeletonSync<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  React.useLayoutEffect(() => {
    ref.current?.style.setProperty('--skeleton-sync', `${-(performance.now() % 2400)}ms`);
  }, []);
  return ref;
}

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  const ref = useSkeletonSync<HTMLDivElement>();
  return <div ref={ref} data-slot="skeleton" className={cn(skeletonClass, className)} {...props} />;
}

// invariant: the twin passes the real copy — box-decoration-break paints one bar per line fragment,
// so wrapping, line count and line widths come from the same layout the loaded screen will use.
function SkeletonLines({
  className,
  surface,
  children,
  ...props
}: React.ComponentProps<'span'> & SkeletonLinesVariants) {
  const ref = useSkeletonSync<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="skeleton"
      className={cn(skeletonLinesVariants({ surface }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

// invariant: the box comes from the real element's own classes and copy — a twin can size a shape
// it cannot measure (button, pill, chip) without restating any number.
function SkeletonShape({ className, children, ...props }: React.ComponentProps<'span'>) {
  const ref = useSkeletonSync<HTMLSpanElement>();
  return (
    <span aria-hidden className={cn('invisible relative', className)} {...props}>
      {children}
      <span className="visible absolute inset-0 rounded-[inherit]">
        <span
          ref={ref}
          data-slot="skeleton"
          className={cn(skeletonClass, 'block size-full rounded-[inherit]')}
        />
      </span>
    </span>
  );
}

export { Skeleton, SkeletonLines, SkeletonShape };
