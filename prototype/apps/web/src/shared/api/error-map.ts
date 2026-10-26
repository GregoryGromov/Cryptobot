import { TRPCClientError } from '@trpc/client';
import { match, P } from 'ts-pattern';
import type { ConnectivityKind } from '~/shared/connectivity/connectivity-store';
import { i18n } from '~/shared/i18n';

export const isClientError = (error: unknown): boolean => {
  if (!(error instanceof TRPCClientError)) return false;
  const status: unknown = error.data?.httpStatus;
  return typeof status === 'number' && status >= 400 && status < 500;
};

export const isUnauthorized = (error: unknown): boolean =>
  error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED';

export const isTransportError = (error: unknown): boolean => {
  if (error instanceof TypeError) return /fetch|network|load failed/i.test(error.message);
  if (error instanceof TRPCClientError) return error.data?.httpStatus == null;
  return false;
};

export type DisplayFaultCause = 'transport' | 'client' | 'server';
export type DisplayFaultKind = 'offline' | 'unreachable' | 'server' | 'client';

export const displayFaultCause = (error: unknown): DisplayFaultCause | undefined => {
  if (error === undefined || error === null) return undefined;
  if (isTransportError(error)) return 'transport';
  if (isClientError(error)) return 'client';
  return 'server';
};

export const classifyDisplayFault = (
  cause: DisplayFaultCause | undefined,
  connectivity: ConnectivityKind,
): DisplayFaultKind =>
  match(cause)
    .with(undefined, (): DisplayFaultKind => (connectivity === 'offline' ? 'offline' : 'server'))
    .with('transport', (): DisplayFaultKind => (connectivity === 'offline' ? 'offline' : 'unreachable'))
    .with('client', (): DisplayFaultKind => 'client')
    .with('server', (): DisplayFaultKind => 'server')
    .exhaustive();

export const errorText = (error: unknown): string => {
  const t = i18n.getFixedT(null, 'errors');
  if (error instanceof TRPCClientError) {
    return match(error.data?.code)
      .with('UNAUTHORIZED', () => t('unauthorized'))
      .with('FORBIDDEN', () => t('forbidden'))
      .with('NOT_FOUND', () => t('notFound'))
      .with(P.union('BAD_REQUEST', 'UNPROCESSABLE_CONTENT'), () => t('badRequest'))
      .with('TOO_MANY_REQUESTS', () => t('tooManyRequests'))
      .with(P.union('INTERNAL_SERVER_ERROR', 'TIMEOUT', 'BAD_GATEWAY'), () => t('server'))
      .otherwise(() => t('network'));
  }
  if (isTransportError(error)) return t('network');
  return t('unknown');
};
