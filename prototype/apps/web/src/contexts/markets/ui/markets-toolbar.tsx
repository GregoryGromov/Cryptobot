import { Input } from '@reinforce/ui-react/input';
import { Toggle } from '@reinforce/ui-react/toggle';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { Search, Star } from 'lucide-react';
import type { MarketClass } from '~/contexts/markets/domain/market-list-vm';
import { useT } from '~/shared/i18n';

const ALL = 'all';

export type MarketsSearch = { readonly cls?: string | undefined; readonly q?: string | undefined };

export function MarketSearch({
  q,
  onSearch,
}: {
  readonly q: string | undefined;
  readonly onSearch: (search: MarketsSearch) => void;
}) {
  const { t } = useT('markets');
  return (
    <div className="relative md:w-80">
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        className="ps-9"
        placeholder={t('search')}
        aria-label={t('searchLabel')}
        defaultValue={q}
        onChange={(event) => onSearch({ q: event.target.value || undefined })}
      />
    </div>
  );
}

export function MarketClasses({
  classes,
  selected,
  onSearch,
  onFollowClass,
}: {
  readonly classes: readonly MarketClass[];
  readonly selected: MarketClass | null;
  readonly onSearch: (search: MarketsSearch) => void;
  readonly onFollowClass: (group: MarketClass, on: boolean) => void;
}) {
  const { t } = useT('markets');
  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-4 md:mx-0 md:px-0">
      <ToggleGroup
        type="single"
        aria-label={t('classes')}
        value={selected?.cls ?? ALL}
        onValueChange={(value) => {
          if (value) onSearch({ cls: value === ALL ? undefined : value });
        }}
      >
        <ToggleGroupItem value={ALL}>{t('all')}</ToggleGroupItem>
        {classes.map((group) => (
          <ToggleGroupItem key={group.cls} value={group.cls}>
            {group.title}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {selected && (
        <Toggle
          variant="outline"
          className="shrink-0"
          pressed={selected.followed}
          aria-label={t('followClassLabel', { title: selected.title })}
          onPressedChange={(on) => onFollowClass(selected, on)}
        >
          <Star className={selected.followed ? 'fill-current' : undefined} />
          {t('followClass')}
        </Toggle>
      )}
    </div>
  );
}
