import {
  type ButtonVariants,
  buttonSpinnerClass,
  buttonVariants,
  ctaButtonMainClass,
  ctaButtonStackClass,
  ctaButtonSubClass,
} from '@reinforce/ui-primitives/button';
import { cn } from '@reinforce/ui-styles/cn';
import { Loader2Icon } from 'lucide-react';
import { Slot } from 'radix-ui';
import type * as React from 'react';
import { Children } from 'react';

const textInSpans = (children: React.ReactNode) =>
  Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? <span>{child}</span> : child,
  );

type ButtonBaseProps = React.ComponentProps<'button'> & ButtonVariants;
type ButtonProps =
  | (ButtonBaseProps & { asChild?: false; loading?: boolean })
  | (ButtonBaseProps & { asChild: true; loading?: never });

function Button({
  className,
  variant = 'default',
  size = 'md',
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? textInSpans(children) : children}
      {loading ? <Loader2Icon data-slot="button-spinner" aria-hidden className={buttonSpinnerClass} /> : null}
    </button>
  );
}

type CtaButtonProps =
  | (Omit<ButtonBaseProps, 'size'> & { asChild?: false; loading?: boolean; sub?: string })
  | (Omit<ButtonBaseProps, 'size'> & { asChild: true; loading?: never; sub?: never });

function CtaButton(props: CtaButtonProps) {
  if (props.asChild) {
    return <Button size="cta" {...props} />;
  }
  const { sub, children, className, ...rest } = props;
  return (
    <Button size="cta" className={cn(sub !== undefined && ctaButtonStackClass, className)} {...rest}>
      {sub === undefined ? (
        children
      ) : (
        <>
          <span className={ctaButtonMainClass}>{children}</span>
          <span className={ctaButtonSubClass}>{sub}</span>
        </>
      )}
    </Button>
  );
}

export { Button, CtaButton };
