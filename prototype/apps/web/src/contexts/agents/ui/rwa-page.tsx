import { sectionCardClass } from '@reinforce/ui-primitives/card';
import { Button } from '@reinforce/ui-react/button';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { Clock3, Scale, ShieldCheck } from 'lucide-react';
import { agentOf } from '~/shared/api/mock/agents';
import { RWA_GROUPS, type RwaAsset, type RwaGroup } from '~/shared/api/mock/rwa';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { dataColumnClass } from '~/shared/ui/page-column';
import { Numeral } from '~/shared/ui/numeral';

export const rwaTintClass: Record<RwaGroup['key'], string> = {
  gold: 'bg-(--palette-amber-500)/16 text-(--palette-amber-600)',
  stocks: 'bg-(--palette-blue-500)/14 text-(--palette-blue-500)',
  bonds: 'bg-(--palette-emerald-500)/14 text-(--palette-emerald-600)',
  estate: 'bg-(--palette-violet-500)/14 text-(--palette-violet-500)',
};

const perkClass =
  'flex items-center gap-1.5 rounded-full bg-foreground/6 px-3 py-1 font-medium text-foreground-soft text-meta [&>svg]:size-3.5';

export function RwaPage() {
  const { t } = useT('shell');
  return (
    <div className={dataColumnClass}>
      <div className="flex max-w-2xl flex-col gap-1">
        <Heading as="h1" size="page">
          {t('agents.rwa.title')}
        </Heading>
        <Text variant="muted" className="text-row">
          {t('agents.rwa.lead')}
        </Text>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={perkClass}>
          <Clock3 strokeWidth={2} />
          {t('agents.rwa.always')}
        </span>
        <span className={perkClass}>
          <Scale strokeWidth={2} />
          {t('agents.rwa.backed')}
        </span>
        <span className={perkClass}>
          <ShieldCheck strokeWidth={2} />
          {t('agents.rwa.checked')}
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {RWA_GROUPS.map((group) => (
          <section
            key={group.key}
            className={cn(sectionCardClass, 'flex flex-col pb-3', group.key === 'stocks' && 'lg:row-span-2')}
          >
            <Heading as="h2" size="section">
              {group.title}
            </Heading>
            <p className="pb-2 text-meta text-muted-foreground">{group.lead}</p>
            <ul className="flex flex-col">
              {group.assets.map((asset) => (
                <RwaRow key={asset.ticker} asset={asset} group={group.key} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-meta text-muted-foreground">{t('agents.rwa.note')}</p>
    </div>
  );
}

function RwaRow({ asset, group }: { readonly asset: RwaAsset; readonly group: RwaGroup['key'] }) {
  const { t } = useT('shell');
  const f = useFormatters();
  return (
    <li className="flex items-center gap-3 border-foreground/7 border-t py-3 first:border-t-0">
      {asset.logo ? (
        <img src={asset.logo} alt="" className="size-9 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-[0.6875rem]',
            rwaTintClass[group],
          )}
        >
          {asset.ticker.slice(0, 2)}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium text-foreground text-sm">{asset.name}</span>
          <span className="font-mono text-[0.6875rem] text-muted-foreground">{asset.ticker}</span>
        </span>
        <span className="truncate text-meta text-muted-foreground">
          {asset.issuer} · {asset.chain} · {asset.backing}
        </span>
      </div>
      <div className="flex w-24 shrink-0 flex-col items-end">
        <span className="font-medium text-foreground text-sm tabular-nums">{asset.price}</span>
        {asset.change !== null && (
          <Numeral tone="direction" direction={directionOf(asset.change, 1)} size="xs">
            {f.change(asset.change, 1)}
          </Numeral>
        )}
        {asset.yield && (
          <span className="text-up text-xs">
            {asset.yield} {t('agents.rwa.yield')}
          </span>
        )}
      </div>
      <Button asChild variant="secondary" size="sm" className="shrink-0">
        <Link {...topicLink(agentOf('trader').topic)}>{t('agents.rwa.buy')}</Link>
      </Button>
    </li>
  );
}
