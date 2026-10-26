import type { ChatProposal, Estimate } from '@reinforce/server/dto';
import { disclosureChevronClass } from '@reinforce/ui-primitives/collapsible';
import { Button } from '@reinforce/ui-react/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@reinforce/ui-react/collapsible';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';

function Term({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end font-figure">{children}</dd>
    </>
  );
}

export function DealTerms({
  proposal,
  estimate,
}: {
  readonly proposal: ChatProposal;
  readonly estimate: Estimate;
}) {
  const { t } = useT('trading');
  const fmt = useFormatters();
  const sign = proposal.side === 'LONG' ? 1 : -1;
  return (
    <Collapsible className="flex flex-col">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="-ms-3 self-start">
          {t('deal.terms')}
          <ChevronDown aria-hidden className={disclosureChevronClass} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 pt-1 pb-1">
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-meta">
            <Term label={t('levels.stop')}>{fmt.change(-sign * proposal.stopLossPct)}</Term>
            <Term label={t('levels.take')}>{fmt.change(sign * proposal.takeProfitPct)}</Term>
            <Term label={t('deal.fees')}>{fmt.usd(estimate.roundTripFee)}</Term>
            <Term label={t('deal.slippage')}>{t('deal.slippageValue', { bps: estimate.slippageBps })}</Term>
            <Term label={t('deal.exitBy')}>
              {t('deal.exitByValue', { time: fmt.clock(estimate.exitBy) })}
            </Term>
          </dl>
          <p className="text-muted-foreground text-xs">{t('deal.virtual')}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
