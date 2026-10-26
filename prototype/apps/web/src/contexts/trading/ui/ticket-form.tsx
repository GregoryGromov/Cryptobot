import type { Quote } from '@reinforce/server/dto';
import { CtaButton } from '@reinforce/ui-react/button';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { cn } from '@reinforce/ui-styles/cn';
import { type FormEvent, useId, useState } from 'react';
import { match } from 'ts-pattern';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useFormatters } from '~/shared/format/use-formatters';
import { useLocale, useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import { failureText, useManualTrade } from '../api/trading-mutations';
import {
  horizonOf,
  initialDraft,
  type RequestIntent,
  requestIntent,
  reviewTicket,
  type TicketDraft,
  type TicketLimits,
} from '../domain/ticket-vm';
import { TicketBlocked } from './ticket-blocked';
import { AmountInput, PercentInput } from './ticket-fields';
import { TicketPreview } from './ticket-preview';

const choiceClass = 'flex-1 data-[state=on]:bg-background/40';

export function TicketForm({
  topic,
  market,
  limits,
  onOrdered,
}: {
  readonly topic: string;
  readonly market: Quote;
  readonly limits: TicketLimits;
  readonly onOrdered: () => void;
}) {
  const { t } = useT('trading');
  const { t: tf } = useT('format');
  const fmt = useFormatters();
  const locale = useLocale();
  const [draft, setDraft] = useState<TicketDraft>(() => initialDraft(limits));
  const [intent, setIntent] = useState<RequestIntent | null>(null);
  const manual = useManualTrade(topic, onOrdered);
  const horizonId = useId();
  const review = reviewTicket({ draft, limits, instrument: market.coin, price: market.price, locale });
  if (review.kind === 'blocked') {
    return (
      <div className="overflow-y-auto px-5 pt-4 pb-5">
        <TicketBlocked reason={review.reason} minUsd={limits.minUsd} />
      </div>
    );
  }

  const edit = (patch: Partial<TicketDraft>) => {
    if (manual.isError) manual.reset();
    setDraft((current) => ({ ...current, ...patch }));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (review.order.kind !== 'ready' || manual.isPending) return;
    const next = requestIntent(intent, review.order.terms, () => crypto.randomUUID());
    setIntent(next);
    manual.mutate({ requestId: next.id, terms: review.order.terms });
  };
  const submitLabel =
    review.amount.kind === 'ok'
      ? t(`ticket.submit.${draft.side}`, { amount: fmt.usd(review.amount.value) })
      : t(`ticket.submitPlain.${draft.side}`);

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-5 pt-4 pb-4 *:shrink-0 sm:gap-4">
        <ToggleGroup
          type="single"
          aria-label={t('ticket.side')}
          value={draft.side}
          onValueChange={(value) => {
            if (value === 'LONG' || value === 'SHORT') edit({ side: value });
          }}
          className="w-full"
        >
          <ToggleGroupItem value="LONG" className={choiceClass}>
            {t('side.LONG')}
          </ToggleGroupItem>
          <ToggleGroupItem value="SHORT" className={choiceClass}>
            {t('side.SHORT')}
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-baseline justify-between gap-4 text-meta">
          <span className="text-muted-foreground">{t('ticket.price')}</span>
          <Numeral weight="medium">
            {market.price === null ? t('status.noPrice') : fmt.price(market.price)}
          </Numeral>
        </div>
        <AmountInput
          value={draft.amount}
          check={review.amount}
          hint={t('ticket.amountHint', { free: fmt.usd(limits.freeUsd), max: fmt.usd(limits.maxUsd) })}
          onChange={(amount) => edit({ amount })}
        />
        <div className="grid grid-cols-2 gap-3">
          <PercentInput
            field="stop"
            label={t('ticket.stop')}
            value={draft.stop}
            check={review.stop}
            onChange={(stop) => edit({ stop })}
          />
          <PercentInput
            field="take"
            label={t('ticket.take')}
            value={draft.take}
            check={review.take}
            onChange={(take) => edit({ take })}
          />
        </div>
        {limits.horizons.length > 1 ? (
          <div className="flex flex-col gap-2">
            <span id={horizonId} className="font-medium text-muted-foreground text-xs">
              {t('ticket.horizon')}
            </span>
            <ToggleGroup
              type="single"
              aria-labelledby={horizonId}
              value={String(horizonOf(draft, limits))}
              onValueChange={(value) => {
                const horizon = limits.horizons.find((h) => String(h) === value);
                if (horizon !== undefined) edit({ horizon });
              }}
              className="w-full"
            >
              {limits.horizons.map((h) => (
                <ToggleGroupItem
                  key={h}
                  value={String(h)}
                  size="sm"
                  className={cn(choiceClass, 'font-figure')}
                >
                  {horizonWords(tf, h)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : (
          <p className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium text-muted-foreground">{t('ticket.horizon')}</span>
            <span className="font-figure text-foreground text-sm">
              {horizonWords(tf, horizonOf(draft, limits))}
            </span>
          </p>
        )}
        {match(review.order)
          .with({ kind: 'ready' }, ({ preview }) => <TicketPreview preview={preview} />)
          .with({ kind: 'unpriced' }, () => (
            <p className="text-meta text-muted-foreground">{t('ticket.noPrice')}</p>
          ))
          .with({ kind: 'incomplete' }, () => null)
          .exhaustive()}
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-foreground/7 border-t px-5 pt-3 pb-5">
        <CtaButton type="submit" loading={manual.isPending} disabled={review.order.kind !== 'ready'}>
          {submitLabel}
        </CtaButton>
        {manual.isError && (
          <p role="alert" className="text-destructive text-meta">
            {failureText(manual.error)}
          </p>
        )}
      </div>
    </form>
  );
}
