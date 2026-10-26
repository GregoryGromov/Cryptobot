import { cn } from '@reinforce/ui-styles/cn';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { codedText } from '../domain/prompts';
import { stampClass } from './feed-classes';

export const stampWords = (clock: (at: number) => string, at: number, via?: string): string | undefined => {
  if (at <= 0) return undefined;
  return via ? `${via} · ${clock(at)}` : clock(at);
};

export function Stamp({
  at,
  via,
  hidden = false,
}: {
  readonly at: number;
  readonly via?: string;
  readonly hidden?: boolean;
}) {
  const f = useFormatters();
  const words = stampWords(f.clock, at, via);
  if (words === undefined) return null;
  return (
    <time
      className={cn(stampClass, hidden && 'invisible')}
      dateTime={new Date(at).toISOString()}
      aria-hidden={hidden || undefined}
    >
      {words}
    </time>
  );
}

export function Coded({ text, code }: { readonly text: string; readonly code: string | null }) {
  const coded = codedText(text, code);
  if (coded.code === null) return text;
  return (
    <>
      <span className="font-semibold text-foreground">{coded.code}</span>
      {coded.rest}
    </>
  );
}

export function Speaker({ who }: { readonly who: 'user' | 'broker' }) {
  const { t } = useT('conversation');
  return (
    <span className="sr-only">
      {match(who)
        .with('user', () => t('feed.who.user'))
        .with('broker', () => t('feed.who.broker'))
        .exhaustive()}{' '}
    </span>
  );
}
