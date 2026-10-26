import { ArrowRight } from 'lucide-react';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useT } from '~/shared/i18n';

/** The broker's word when he offers no trade: the mark a trade gets, grey, saying to stay out. */
export function DealFlat({ horizon }: { readonly horizon: number }) {
  const { t } = useT('trading');
  const { t: format } = useT('format');
  return (
    <section aria-label={t('deal.flat.label')} className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground/7 px-4.5 font-semibold text-[0.9375rem] text-foreground-soft">
        <ArrowRight aria-hidden strokeWidth={2.4} className="size-[1.0625rem]" />
        {t('deal.flat.label')}
      </span>
      <span className="ms-auto text-meta text-muted-foreground">
        {t('deal.flat.why', { horizon: horizonWords(format, horizon) })}
      </span>
    </section>
  );
}
