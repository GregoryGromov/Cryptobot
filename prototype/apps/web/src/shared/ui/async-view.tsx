import type { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { displayFaultCause } from '~/shared/api/error-map';
import { useIsBrowserOffline } from '~/shared/connectivity/connectivity-store';
import { FaultState } from './fault-state';

type AsyncPhase = 'loading' | 'fault' | 'empty' | 'ready';

const decideAsyncView = (input: {
  readonly hasData: boolean;
  readonly isError: boolean;
  readonly empty: boolean;
  readonly offline: boolean;
}): AsyncPhase => {
  if (input.hasData) return input.empty ? 'empty' : 'ready';
  if (input.isError || input.offline) return 'fault';
  return 'loading';
};

export function AsyncView<T>({
  query,
  errorTitle,
  loading,
  empty,
  children,
}: {
  readonly query: {
    readonly data: T | undefined;
    readonly isError: boolean;
    readonly error?: unknown;
    readonly refetch?: () => unknown;
  };
  readonly errorTitle: string;
  readonly loading: ReactNode;
  readonly empty?: { readonly when: (data: T) => boolean; readonly render: ReactNode };
  readonly children: (data: T) => ReactNode;
}): ReactNode {
  const offline = useIsBrowserOffline();
  const { data } = query;
  const hasData = data !== undefined;
  const refetch = query.refetch;
  return match(
    decideAsyncView({
      hasData,
      isError: query.isError,
      empty: hasData && empty !== undefined ? empty.when(data) : false,
      offline,
    }),
  )
    .with('ready', () => children(data as T))
    .with('empty', () => empty?.render ?? null)
    .with('fault', () => (
      <FaultState
        title={errorTitle}
        cause={displayFaultCause(query.error)}
        {...(refetch ? { onRetry: () => void refetch() } : {})}
        ghost={loading}
      />
    ))
    .with('loading', () => loading)
    .exhaustive();
}
