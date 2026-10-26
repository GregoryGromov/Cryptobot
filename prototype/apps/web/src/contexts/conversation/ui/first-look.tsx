import type { Quote } from '@reinforce/server/dto';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { Clock } from 'lucide-react';
import { match } from 'ts-pattern';
import { useLocale, useT } from '~/shared/i18n';
import { inSentence } from '~/shared/i18n/in-sentence';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { plainWords } from '../domain/broker-words';
import type { Announcement } from '../domain/conversation-vm';
import { useClosedUntil } from './use-closed-until';

export function FirstLook({ market }: { readonly market: Quote }) {
  const { t } = useT('conversation');
  const locale = useLocale();
  const closed = useClosedUntil(market.coin);
  return (
    <div className="m-auto flex max-w-sm flex-col items-center gap-3 py-10 text-center">
      <CoinLogo coin={market.coin} ticker={market.ticker} size="lg" />
      <Heading as="h2" size="section">
        {t('feed.first', { name: inSentence(market.name, locale) })}
      </Heading>
      <Text variant="muted">{t('feed.firstHint')}</Text>
      {closed && (
        <p className="flex items-start gap-2 text-left text-meta text-muted-foreground">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t('feed.closed', { when: closed })}
        </p>
      )}
    </div>
  );
}

export function Announcer({
  announcement,
  marketName,
}: {
  readonly announcement: Announcement;
  readonly marketName: string | null;
}) {
  const { t } = useT('conversation');
  const locale = useLocale();
  const name = marketName ? inSentence(marketName, locale) : t('wait.market');
  const said = match(announcement)
    .with({ kind: 'none' }, () => '')
    .with({ kind: 'writing' }, () => t('feed.writing'))
    .with({ kind: 'waiting', wait: 'forecast' }, () => t('wait.forecast', { name }))
    .with({ kind: 'waiting', wait: 'converse' }, () => t('wait.thinking'))
    .with({ kind: 'answer' }, ({ text }) => plainWords(text))
    .exhaustive();
  return (
    <p aria-live="polite" className="sr-only">
      {said}
    </p>
  );
}
