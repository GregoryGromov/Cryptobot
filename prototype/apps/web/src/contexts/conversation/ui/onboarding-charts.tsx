import { linearScale } from '@reinforce/ui-primitives/charts';
import { cn } from '@reinforce/ui-styles/cn';
import type { ReactNode } from 'react';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { DEMO, DEMO_AFTER, DEMO_BEFORE, priceAt } from '../domain/tour';

const revealClass = 'motion-safe:animate-[reveal-right_900ms_var(--ease-emphasized)_both]';

type Point = readonly [number, number];

const pathOf = (points: readonly Point[]): string =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

const percentOf = (value: number, of: number): string => `${(value / of) * 100}%`;

function Tag({
  top,
  left,
  children,
  className,
}: {
  readonly top: string;
  readonly left?: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <span
      style={{ top, left }}
      className={cn(
        'absolute -translate-y-1/2 whitespace-nowrap font-figure text-[0.6875rem] leading-4',
        className,
      )}
    >
      {children}
    </span>
  );
}

const FAN = { width: 320, height: 112, now: 176, end: 316 } as const;

/** The broker's forecast: the price so far, and the cone of where it goes in the next minutes. */
export function TourFan() {
  const { t } = useT('conversation');
  const { t: format } = useT('format');
  const f = useFormatters();
  const x = linearScale([0, DEMO_BEFORE.length - 1], [4, FAN.now]);
  const y = linearScale([66_350, 68_050], [FAN.height - 4, 4]);
  const past = pathOf(DEMO_BEFORE.map((price, i) => [x(i), y(price)]));
  const start = y(DEMO.entry);
  return (
    <div className="mb-6 flex">
      <div className="relative min-w-0 flex-1">
        <svg
          aria-hidden
          viewBox={`0 0 ${FAN.width} ${FAN.height}`}
          preserveAspectRatio="none"
          className="block h-28 w-full"
          fill="none"
        >
          <path
            d={`M${FAN.now} 0V${FAN.height}`}
            className="stroke-foreground/25"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={past}
            className={cn('stroke-muted-foreground', revealClass)}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <g className={revealClass} style={{ animationDelay: '600ms' }}>
            <path
              d={`M${FAN.now} ${start}L${FAN.end} ${y(67_150)}L${FAN.end} ${y(66_450)}Z`}
              className="fill-primary/22"
            />
            <path
              d={`M${FAN.now} ${start}L${FAN.end} ${y(DEMO.take)}`}
              className="stroke-primary"
              strokeWidth={1.75}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
        <Tag
          top="100%"
          left={percentOf(FAN.now, FAN.width)}
          className="mt-3 -translate-x-1/2 text-muted-foreground"
        >
          {t('onboarding.fan.now')}
        </Tag>
        <Tag top="100%" className="end-0 mt-3 text-muted-foreground">
          {t('onboarding.fan.later', { term: horizonWords(format, DEMO.horizon) })}
        </Tag>
      </div>
      <div className="relative w-14 shrink-0">
        <Tag top={percentOf(y(DEMO.take), FAN.height)} className="start-2 font-medium text-foreground">
          {f.price(DEMO.take)}
        </Tag>
      </div>
    </div>
  );
}

const RACE = { width: 320, height: 132 } as const;
const PAST_POINTS = DEMO_BEFORE.length - 1;
const ALL_POINTS = PAST_POINTS + DEMO_AFTER.length - 1;

const LEVELS = [
  { key: 'stop', price: DEMO.stop, line: 'stroke-down/55', label: 'text-down' },
  { key: 'entry', price: DEMO.entry, line: 'stroke-foreground/30', label: 'text-muted-foreground' },
  { key: 'take', price: DEMO.take, line: 'stroke-up/60', label: 'text-up' },
] as const;

/** The trade on fast-forward: the price runs on from the entry, a `share` of the way to where it closed. */
export function TourRace({ share }: { readonly share: number }) {
  const { t } = useT('trading');
  const f = useFormatters();
  const x = linearScale([0, ALL_POINTS], [4, RACE.width - 6]);
  const y = linearScale([66_650, 68_050], [RACE.height - 6, 6]);
  const past = pathOf(DEMO_BEFORE.map((price, i) => [x(i), y(price)]));
  const reached = share * (DEMO_AFTER.length - 1);
  const head: Point = [x(PAST_POINTS + reached), y(priceAt(share))];
  const run = pathOf([
    ...DEMO_AFTER.slice(0, Math.floor(reached) + 1).map((price, i): Point => [x(PAST_POINTS + i), y(price)]),
    head,
  ]);
  return (
    <div className="flex">
      <div className="relative min-w-0 flex-1">
        <svg
          aria-hidden
          viewBox={`0 0 ${RACE.width} ${RACE.height}`}
          preserveAspectRatio="none"
          className="block h-34 w-full"
          fill="none"
        >
          {LEVELS.map((level) => (
            <path
              key={level.key}
              d={`M0 ${y(level.price)}H${RACE.width}`}
              className={level.line}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path
            d={past}
            className="stroke-muted-foreground/70"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={run}
            className="stroke-foreground"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          aria-hidden
          style={{ left: percentOf(head[0], RACE.width), top: percentOf(head[1], RACE.height) }}
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-4 ring-foreground/15"
        />
      </div>
      <div className="relative w-24 shrink-0">
        {LEVELS.map((level) => (
          <Tag
            key={level.key}
            top={percentOf(y(level.price), RACE.height)}
            className={cn('start-2.5', level.label)}
          >
            {`${t(`levels.${level.key}`)} ${f.price(level.price)}`}
          </Tag>
        ))}
      </div>
    </div>
  );
}
