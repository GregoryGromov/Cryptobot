import {
  type StepTimelineDensity,
  type StepTimelineStatus,
  stepTimelineChipVariants,
  stepTimelineOrdinalGapClass,
  stepTimelineStatusChipVariants,
} from '@reinforce/ui-primitives/step-timeline';
import { cn } from '@reinforce/ui-styles/cn';
import { AlertTriangle, Check, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import type * as React from 'react';

type StepTimelineItem = {
  readonly key: string;
  readonly label: React.ReactNode;
  readonly status?: StepTimelineStatus;
  readonly hint?: React.ReactNode;
  readonly trailing?: React.ReactNode;
};

type StepTimelineVariant = 'ordinal' | 'status';

function StepTimeline({
  steps,
  completedLabel,
  variant = 'ordinal',
  density = 'default',
  className,
}: {
  readonly steps: readonly (string | StepTimelineItem)[];
  readonly completedLabel: string;
  readonly variant?: StepTimelineVariant;
  readonly density?: StepTimelineDensity;
  readonly className?: string;
}) {
  const items = steps.map(
    (step, i): StepTimelineItem => (typeof step === 'string' ? { key: `${i}:${step}`, label: step } : step),
  );
  const isStatus = variant === 'status';

  return (
    <ol data-slot="step-timeline" className={cn('flex w-full flex-col text-left', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        const status = item.status ?? 'pending';
        const done = status === 'done';
        return (
          <li key={item.key} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                data-status={status}
                aria-current={status === 'active' ? 'step' : undefined}
                className={
                  isStatus ? stepTimelineStatusChipVariants({ status }) : stepTimelineChipVariants({ status })
                }
              >
                {isStatus ? (
                  <StatusIcon status={status} />
                ) : done ? (
                  <Check strokeWidth={3} aria-hidden />
                ) : (
                  <span aria-hidden>{i + 1}</span>
                )}
                {done ? <span className="sr-only"> {completedLabel}</span> : null}
              </span>
              {!last && (
                <span
                  className={cn('my-1 w-0.5 flex-1 rounded-full', done ? 'bg-success/30' : 'bg-primary/25')}
                />
              )}
            </div>
            <div
              className={cn(
                'flex flex-1 items-start justify-between gap-3',
                isStatus ? 'pt-0.5 pb-3' : 'pt-1',
                !isStatus && (last ? 'pb-1' : stepTimelineOrdinalGapClass[density]),
              )}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={cn(
                    'text-[0.875rem] leading-snug',
                    item.hint ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
                {item.hint ? (
                  <span className="text-muted-foreground text-xs leading-snug">{item.hint}</span>
                ) : null}
              </div>
              {item.trailing}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Keyed by status so the icon re-animates on each transition (Circle → spinner → check).
function StatusIcon({ status }: { readonly status: StepTimelineStatus }) {
  return (
    <span
      key={status}
      className="motion-safe:fade-in motion-safe:zoom-in-95 grid place-items-center duration-(--motion-duration-elevated) motion-safe:animate-in"
    >
      {status === 'pending' && <Circle className="size-3" strokeWidth={2} aria-hidden />}
      {status === 'active' && (
        <Loader2 className="size-4 motion-safe:animate-spin" strokeWidth={2.5} aria-hidden />
      )}
      {status === 'done' && <CheckCircle2 className="size-4" strokeWidth={2.25} aria-hidden />}
      {status === 'attention' && <AlertTriangle className="size-3.5" strokeWidth={2.25} aria-hidden />}
    </span>
  );
}

export { StepTimeline };
