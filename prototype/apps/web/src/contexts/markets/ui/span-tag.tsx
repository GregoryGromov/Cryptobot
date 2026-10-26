import { cn } from '@reinforce/ui-styles/cn';
import { MoveHorizontal, X } from 'lucide-react';
import { match } from 'ts-pattern';
import type { Formatters } from '~/shared/format/use-formatters';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { type Span, spanAsks } from '../domain/chart-vm';
import { usePickedGist } from './use-chart-dock';

const DAY = 86_400_000;

export function useSpanWords(): (span: Span) => string {
  const { t } = useT('markets');
  const f: Formatters = useFormatters();
  return (span) =>
    span.to - span.from >= DAY || f.day(span.from) !== f.day(span.to - 1)
      ? t('chart.spanDays', { from: f.day(span.from), to: f.day(span.to - 1) })
      : t('chart.span', { day: f.day(span.from), from: f.clock(span.from), to: f.clock(span.to) });
}

/** The questions the span picked on a topic's chart invites, worded by what it showed. */
export function useSpanAsks(topic: string): readonly string[] {
  const { t } = useT('markets');
  const f = useFormatters();
  const gist = usePickedGist(topic);
  return spanAsks(gist).map((ask) =>
    match(ask)
      .with({ kind: 'move' }, ({ change }) => t('chart.asks.move', { change: f.change(change, 1) }))
      .with({ kind: 'volume' }, ({ ratio }) => t('chart.asks.volume', { ratio: f.decimal(ratio, 1) }))
      .with({ kind: 'moveVolume' }, ({ change, ratio }) =>
        t('chart.asks.moveVolume', { change: f.change(change, 1), ratio: f.decimal(ratio, 1) }),
      )
      .with(
        { kind: 'what' },
        { kind: 'before' },
        { kind: 'beforeRise' },
        { kind: 'beforeFall' },
        { kind: 'next' },
        { kind: 'after' },
        ({ kind }) => t(`chart.asks.${kind}`),
      )
      .exhaustive(),
  );
}

const tagClass =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-medium text-meta text-primary';

/** A stretch of the chart a question is about: in the composer with a way to drop it, under a question to show it. */
export function SpanTag({
  span,
  onClear,
  onShow,
  className,
}: {
  readonly span: Span;
  readonly onClear?: () => void;
  readonly onShow?: () => void;
  readonly className?: string;
}) {
  const { t } = useT('markets');
  const words = useSpanWords()(span);
  if (onShow)
    return (
      <button
        type="button"
        title={t('chart.show')}
        onClick={onShow}
        className={cn(tagClass, 'focus-ring transition-colors hover:bg-primary/15', className)}
      >
        <MoveHorizontal aria-hidden className="size-3.5" />
        {words}
      </button>
    );
  return (
    <span className={cn(tagClass, 'mt-1.5', className)}>
      <MoveHorizontal aria-hidden className="size-3.5" />
      {words}
      {onClear && (
        <button
          type="button"
          aria-label={t('chart.clear')}
          onClick={onClear}
          className="focus-ring -me-1 rounded-full p-0.5 transition-colors hover:bg-primary/15"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </span>
  );
}
