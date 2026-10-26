import type { AnalysisProgress, MarketName } from '@reinforce/server/dto';
import { cn } from '@reinforce/ui-styles/cn';
import { Sparkle } from 'lucide-react';
import { match } from 'ts-pattern';
import { useServerNow } from '~/shared/api/live';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import type { Pending } from '../domain/chat-types';
import { waitView } from '../domain/waiting';
import { AnalysisWait } from './analysis-wait';
import { brokerTextClass } from './feed-classes';

const WAIT_TICK_MS = 500;

/** The broker at work: an analysis shows the market he reads and how far he has written, an answer his thinking. */
export function WaitFor({
  run,
  market,
  progress = null,
}: {
  readonly run: Pending;
  readonly market: MarketName | null;
  readonly progress?: AnalysisProgress | null;
}) {
  return match(run.kind)
    .with('forecast', () => <AnalysisWait run={run} market={market} progress={progress} />)
    .with('converse', () => <Waiting run={run} />)
    .exhaustive();
}

function Waiting({ run }: { readonly run: Pending }) {
  const { t } = useT('conversation');
  const f = useFormatters();
  const now = useServerNow(WAIT_TICK_MS);
  const view = waitView(run, now);
  return (
    <div className={cn(brokerTextClass, 'flex flex-col gap-0.5')}>
      <div className="flex items-center gap-2.5">
        <Sparkle
          aria-hidden
          strokeWidth={0}
          className="thought-twinkle size-4.5 shrink-0 fill-current text-primary"
        />
        <span className="thought-shimmer font-semibold">{t('wait.thinking')}</span>
        {view.clock !== null && (
          <span
            aria-hidden
            className="motion-safe:fade-in font-figure text-muted-foreground text-xs motion-safe:animate-in motion-safe:duration-500"
          >
            {f.elapsed(view.clock)}
          </span>
        )}
      </div>
      {(view.retry || view.slow) && (
        <p className="motion-safe:fade-in flex flex-wrap gap-x-3 ps-7 text-muted-foreground text-xs motion-safe:animate-in motion-safe:duration-500">
          {view.retry && <span>{t('wait.retry')}</span>}
          {view.slow && <span>{t('wait.slow')}</span>}
        </p>
      )}
    </div>
  );
}
