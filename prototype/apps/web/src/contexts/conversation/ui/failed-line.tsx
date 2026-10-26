import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { useT } from '~/shared/i18n';
import { useRetryRun } from '../api/mutations';
import type { FailedItem } from '../domain/chat-types';
import { noteLineClass } from './feed-classes';

export function FailedLine({ failure }: { readonly failure: FailedItem }) {
  const { t } = useT('conversation');
  const [requestId] = useState(() => crypto.randomUUID());
  const retry = useRetryRun();
  const error = failure.error ?? t('feed.modelError');
  return (
    <p className={cn(noteLineClass, 'flex flex-wrap items-center justify-center gap-x-2 gap-y-1')}>
      <span>
        <TriangleAlert
          aria-hidden
          className="me-1.5 inline size-3.5 align-[-0.15em] text-warning"
          strokeWidth={2}
        />
        {match(failure.runKind)
          .with('forecast', () => t('feed.failed.forecast', { error }))
          .with('converse', () => t('feed.failed.converse', { error }))
          .exhaustive()}
      </span>
      {failure.retry && (
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0"
          loading={retry.isPending}
          onClick={() => retry.mutate({ runId: failure.runId, requestId })}
        >
          {t('feed.retry')}
        </Button>
      )}
    </p>
  );
}

export function RefusedLine({ reason }: { readonly reason: string }) {
  return (
    <p role="status" className={noteLineClass}>
      <TriangleAlert
        aria-hidden
        className="me-1.5 inline size-3.5 align-[-0.15em] text-warning"
        strokeWidth={2}
      />
      {reason}
    </p>
  );
}
