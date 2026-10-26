import { cardVariants, sectionCardHeadClass, sectionCardLinkClass } from '@reinforce/ui-primitives/card';
import { linearScale, linePath, valueExtent } from '@reinforce/ui-primitives/charts';
import { Badge } from '@reinforce/ui-react/badge';
import { Skeleton, SkeletonLines } from '@reinforce/ui-react/skeleton';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, type LucideIcon } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import type { HourStory, StoryMarket } from '~/contexts/markets/domain/hour-stories';
import type { Direction } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { topicLink } from '~/shared/routing/topics';
import { CoinLogo } from '~/shared/ui/coin-logo';
import { directionClass } from '~/shared/ui/direction-class';
import { Numeral } from '~/shared/ui/numeral';

const TWINS = ['a', 'b', 'c'] as const;
const CHART = { width: 300, height: 92, pad: 7 } as const;
const FADES = [1, 0.62, 0.38] as const;
const CHANGE_DIGITS = 2;
const ARROWS: Record<Direction, LucideIcon> = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight };

const rowClass =
  '-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] @3xl:mx-0 @3xl:grid @3xl:grid-cols-3 @3xl:gap-3 @3xl:overflow-visible @3xl:px-0';
const itemClass = 'flex min-w-0 shrink-0 basis-[78%] snap-center @3xl:basis-auto';
const cardClass = 'w-full min-w-0 gap-2.5 px-4 pt-4 pb-3.5';
const chartClass = 'my-0.5 block h-23 w-full';
const chipClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground/6 py-px ps-0.5 pe-2 font-medium text-meta';
const footClass =
  'focus-ring -mx-4 mt-auto -mb-3.5 flex items-center justify-between rounded-b-(--radius-card) border-foreground/7 border-t px-4 py-3 font-medium text-foreground-soft text-meta transition-colors hover:text-foreground [&_svg]:size-[0.9375rem]';

export function HourStories({ stories }: { readonly stories: readonly HourStory[] }) {
  if (stories.length === 0) return null;
  return (
    <HourStoriesFrame>
      {stories.map((story) => (
        <li key={story.id} className={itemClass}>
          <StoryCard story={story} />
        </li>
      ))}
    </HourStoriesFrame>
  );
}

export function HourStoriesSkeleton() {
  return (
    <HourStoriesFrame twin>
      {TWINS.map((twin) => (
        <li key={twin} className={itemClass}>
          <div className={cn(cardVariants(), cardClass)}>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-48 max-w-full" />
            <span className={chartClass} />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        </li>
      ))}
    </HourStoriesFrame>
  );
}

function HourStoriesFrame({
  twin = false,
  children,
}: {
  readonly twin?: boolean;
  readonly children: ReactNode;
}) {
  const { t } = useT('markets');
  const { t: signals } = useT('signals');
  const heading = useId();
  return (
    <section
      aria-labelledby={heading}
      aria-busy={twin || undefined}
      className="@container flex flex-col gap-3"
    >
      <div className={sectionCardHeadClass}>
        <div className="flex min-w-0 @3xl:flex-row flex-col @3xl:items-center @3xl:gap-2.5 gap-1">
          <Heading as="h2" size="section" id={heading}>
            {twin ? <SkeletonLines>{t('stories.title')}</SkeletonLines> : t('stories.title')}
          </Heading>
          {!twin && (
            <p className="flex items-center gap-1.5 text-meta text-muted-foreground">
              <Badge variant="secondary" size="sm">
                {t('stories.mock')}
              </Badge>
              {t('stories.mockNote')}
            </p>
          )}
        </div>
        {!twin && (
          <Link to="/signals" className={sectionCardLinkClass}>
            {signals('all')}
            <ChevronRight aria-hidden />
          </Link>
        )}
      </div>
      <ul aria-hidden={twin || undefined} className={rowClass}>
        {children}
      </ul>
    </section>
  );
}

function StoryCard({ story }: { readonly story: HourStory }) {
  const { t } = useT('markets');
  return (
    <article className={cn(cardVariants(), cardClass)}>
      <p className="flex items-center gap-1.5 text-meta text-muted-foreground">
        <StoryArrow direction={story.direction} />
        {t(`stories.items.${story.id}.meta`)}
      </p>
      <Heading as="h3" size="section">
        {t(`stories.items.${story.id}.title`)}
      </Heading>
      <StoryChart story={story} />
      <ul className="flex flex-wrap items-center gap-1.5">
        {story.markets.map((market) => (
          <li key={market.coin} className="flex">
            <MarketChip market={market} />
          </li>
        ))}
        {story.against !== null && (
          <li className="flex">
            <AgainstTag market={story.against} />
          </li>
        )}
      </ul>
      <p className="text-foreground-soft text-meta leading-5">{t(`stories.items.${story.id}.text`)}</p>
      {story.topic !== null && (
        <Link {...topicLink(story.topic)} className={footClass}>
          {t('stories.discuss')}
          <ChevronRight aria-hidden />
        </Link>
      )}
    </article>
  );
}

function StoryArrow({ direction }: { readonly direction: Direction }) {
  const Icon = ARROWS[direction];
  return <Icon aria-hidden strokeWidth={2} className={cn('size-4.5 shrink-0', directionClass(direction))} />;
}

function StoryChart({ story }: { readonly story: HourStory }) {
  const lines = story.against === null ? story.markets : [...story.markets, story.against];
  const steps = Math.max(...lines.map((line) => line.moves.length)) - 1;
  const x = linearScale([0, steps], [0, CHART.width]);
  const y = linearScale(valueExtent([0, ...lines.flatMap((line) => line.moves)]) ?? [0, 1], [
    CHART.height - CHART.pad,
    CHART.pad,
  ]);
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      preserveAspectRatio="none"
      className={chartClass}
    >
      <line
        x1={0}
        x2={CHART.width}
        y1={y(0)}
        y2={y(0)}
        className="stroke-foreground/14"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      {story.against !== null && (
        <path
          d={linePath(story.against.moves, x, y)}
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {story.markets.map((market, index) => (
        <path
          key={market.coin}
          d={linePath(market.moves, x, y)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={FADES[index] ?? FADES[2]}
          vectorEffect="non-scaling-stroke"
          className={directionClass(market.direction)}
        />
      ))}
    </svg>
  );
}

function MarketChip({ market }: { readonly market: StoryMarket }) {
  const { change } = useFormatters();
  const body = (
    <>
      <CoinLogo coin={market.coin} ticker={market.ticker} className="size-4 text-[0.4375rem]" />
      {market.name}
      <Numeral tone="direction" direction={market.direction}>
        {change(market.change, CHANGE_DIGITS)}
      </Numeral>
    </>
  );
  if (market.topic === null) return <span className={chipClass}>{body}</span>;
  return (
    <Link
      {...topicLink(market.topic)}
      className={cn(chipClass, 'focus-ring transition-colors hover:bg-foreground/10')}
    >
      {body}
    </Link>
  );
}

function AgainstTag({ market }: { readonly market: StoryMarket }) {
  const { change } = useFormatters();
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-1 text-meta text-muted-foreground">
      <span aria-hidden className="w-3.5 border-muted-foreground border-t-[1.5px] border-dashed" />
      {market.name}
      <Numeral weight="medium">{change(market.change, CHANGE_DIGITS)}</Numeral>
    </span>
  );
}
