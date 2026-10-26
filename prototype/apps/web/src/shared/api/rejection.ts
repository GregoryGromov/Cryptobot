import { i18n, known } from '~/shared/i18n';

export type Rejected = { readonly kind: 'rejected'; readonly reason: string };

export const isRejected = (result: unknown): result is Rejected =>
  typeof result === 'object' &&
  result !== null &&
  'kind' in result &&
  result.kind === 'rejected' &&
  'reason' in result &&
  typeof result.reason === 'string';

const rejectionText = (reason: string): string => {
  const t = i18n.getFixedT(null, 'errors');
  return known(t('reasons', { returnObjects: true }), reason) ?? t('failed');
};

export class RejectedError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(rejectionText(reason));
    this.reason = reason;
  }
}

export const accepted = <T>(result: T): Exclude<T, Rejected> => {
  if (isRejected(result)) throw new RejectedError(result.reason);
  return result as Exclude<T, Rejected>;
};
