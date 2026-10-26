import type { ChatRow, Preview } from '@reinforce/server/dto';
import type { TFunction } from 'i18next';
import { match } from 'ts-pattern';
import { horizonWords, leanWords } from '~/contexts/forecast/domain/verdict';
import type { Formatters } from '~/shared/format/use-formatters';
import { plainWords } from './broker-words';

export type PreviewWords = {
  readonly conversation: TFunction<'conversation'>;
  readonly format: TFunction<'format'>;
  readonly fmt: Formatters;
};

type ForecastPreview = Extract<Preview, { kind: 'forecast' }>;

const quoteText = (row: ChatRow, { conversation, fmt }: PreviewWords): string => {
  if (!('price' in row) || row.price === null) return '';
  if (row.change1h === null) return fmt.price(row.price);
  return conversation('topics.preview.quote', {
    price: fmt.price(row.price),
    change: fmt.change(row.change1h, 2),
  });
};

const dealText = (preview: ForecastPreview, { conversation, format, fmt }: PreviewWords): string => {
  if (preview.proposal)
    return conversation(`topics.preview.${preview.proposal.side}`, {
      amount: fmt.usdWhole(preview.proposal.sizeUsd),
    });
  return match(preview.action)
    .with('FLAT', () => conversation('topics.preview.noTrade'))
    .with('LONG', 'SHORT', (action) => format(`action.${action}`))
    .exhaustive();
};

export const previewText = (row: ChatRow, words: PreviewWords): string => {
  const { conversation, format, fmt } = words;
  if (row.preview === null) return quoteText(row, words);
  return match(row.preview)
    .with({ kind: 'busy' }, () => conversation('topics.preview.busy'))
    .with({ kind: 'signal' }, (preview) =>
      conversation('topics.preview.signal', {
        move: fmt.move(preview.move),
        horizon: horizonWords(format, preview.horizon),
      }),
    )
    .with({ kind: 'forecast' }, (preview) =>
      conversation('topics.preview.forecast', {
        lean: leanWords(format, preview.probs),
        what: dealText(preview, words),
      }),
    )
    .with({ kind: 'proposal' }, (preview) =>
      conversation(`topics.preview.idea_${preview.side}`, { amount: fmt.usdWhole(preview.sizeUsd) }),
    )
    .with({ kind: 'text', role: 'user' }, (preview) =>
      conversation('topics.preview.you', { text: preview.text }),
    )
    .with({ kind: 'text', role: 'broker' }, { kind: 'text', role: 'system' }, (preview) =>
      plainWords(preview.text),
    )
    .exhaustive();
};
