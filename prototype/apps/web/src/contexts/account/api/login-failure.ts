import { TRPCClientError } from '@trpc/client';
import { errorText } from '~/shared/api/error-map';

export const loginFailureText = (error: unknown): string => {
  if (!(error instanceof TRPCClientError)) return errorText(error);
  const status: unknown = error.data?.httpStatus;
  return typeof status === 'number' && error.message !== '' ? error.message : errorText(error);
};
