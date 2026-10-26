import type { BookCycle } from '@reinforce/server/dto';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { Label } from '@reinforce/ui-react/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@reinforce/ui-react/select';
import { useNavigate } from '@tanstack/react-router';
import { RotateCcw } from 'lucide-react';
import { useId } from 'react';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import type { BookView } from '../domain/book-vm';
import { cycleSearch } from '../domain/portfolio-search';

export function CycleSelect({ view }: { readonly view: BookView }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  const navigate = useNavigate({ from: '/portfolio' });
  const id = useId();
  const selected = view.cycle;
  if (selected === null || view.cycles.length < 2) return null;
  const optionText = (cycle: BookCycle) =>
    t(cycle.endedAt === null ? 'cycle.current' : 'cycle.option', {
      n: cycle.number,
      date: fmt.day(cycle.startedAt),
    });
  const pick = (cycleId: string) => {
    const current = view.cycles.find((cycle) => cycle.id === cycleId)?.endedAt === null;
    void navigate({
      search: (prev) => ({
        ...prev,
        ...cycleSearch(view.key, current ? undefined : cycleId),
        trade: undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={id} className="text-muted-foreground text-xs">
          {t('cycle.label')}
        </Label>
        <Select value={selected.id} onValueChange={pick}>
          <SelectTrigger id={id} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {view.cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {optionText(cycle)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {view.period.kind === 'ended' && view.period.cycle.endNav !== null && (
        <InlineNote tone="neutral" size="sm" icon={RotateCcw}>
          {t('cycle.ended', { n: view.period.cycle.number, nav: fmt.usd(view.period.cycle.endNav) })}
        </InlineNote>
      )}
    </div>
  );
}
