import { cn } from '@reinforce/ui-styles/cn';
import { useState } from 'react';

const missing = new Set<string>();

const SIZE = { sm: 'size-5 text-[0.5rem]', md: 'size-7 text-[0.625rem]', lg: 'size-9 text-xs' } as const;

export function CoinLogo({
  coin,
  ticker,
  size = 'md',
  className,
}: {
  readonly coin: string;
  readonly ticker: string;
  readonly size?: keyof typeof SIZE;
  readonly className?: string;
}) {
  const [broken, setBroken] = useState(() => missing.has(coin));
  const box = cn('shrink-0 rounded-full', SIZE[size], className);
  if (broken)
    return (
      <span
        aria-hidden
        className={cn(
          box,
          'inline-flex items-center justify-center bg-muted font-semibold text-muted-foreground',
        )}
      >
        {ticker.slice(0, 2)}
      </span>
    );
  return (
    <img
      className={cn(box, 'bg-muted object-cover')}
      src={`https://app.hyperliquid.xyz/coins/${coin}.svg`}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        missing.add(coin);
        setBroken(true);
      }}
    />
  );
}
