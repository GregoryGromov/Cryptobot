import type { ChatRow } from '@reinforce/server/dto';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { previewText } from '../domain/topic-preview';

export function useTopicPreview(): (row: ChatRow) => string {
  const { t: conversation } = useT('conversation');
  const { t: format } = useT('format');
  const fmt = useFormatters();
  return (row) => previewText(row, { conversation, format, fmt });
}
