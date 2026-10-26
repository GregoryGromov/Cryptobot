import { marketHours } from '@reinforce/server/dto';
import { match } from 'ts-pattern';
import { useServerNow } from '~/shared/api/live';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { openingDay } from '../domain/opening';

const TICK_MS = 60_000;

/** When a market's shut exchange opens, in words; null while it trades or for a market that always does. */
export function useClosedUntil(coin: string | null): string | null {
  const { t } = useT('conversation');
  const f = useFormatters();
  const now = useServerNow(TICK_MS);
  const hours = coin ? marketHours(coin, now) : null;
  if (!hours || hours.open) return null;
  const time = f.clock(hours.opensAt);
  return match(openingDay(hours.opensAt, now))
    .with('today', () => t('opens.today', { time }))
    .with('tomorrow', () => t('opens.tomorrow', { time }))
    .with('later', () => t('opens.later', { time, day: f.day(hours.opensAt) }))
    .exhaustive();
}
