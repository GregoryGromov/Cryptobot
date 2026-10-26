import { Button } from '@reinforce/ui-react/button';
import { cn } from '@reinforce/ui-styles/cn';
import { ChevronLeft, FastForward } from 'lucide-react';
import { Fragment, type RefObject, useEffect, useReducer, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { useFormatters } from '~/shared/format/use-formatters';
import { board, useFlight } from '~/shared/hooks/use-arrival';
import { usePrefersReducedMotion } from '~/shared/hooks/use-media-query';
import { useT } from '~/shared/i18n';
import {
  askOf,
  beatAt,
  DEMO,
  TOUR_BEATS,
  TOUR_START,
  type TourAsk,
  type TourBeat,
  tourReducer,
} from '../domain/tour';
import { bubbleBodyClass, columnClass, floorClass, noteLineClass, userBubbleClass } from './feed-classes';
import { Entry } from './feed-entry';
import { BeatBody, LANDS } from './onboarding-beats';
import { useOnboardingActions } from './onboarding-store';

const TYPE_CHAR_MS = 34;
const TYPE_PAUSE_MS = 350;
const LEAVE_MS = 260;

const helpClass =
  'glass-strong glass-lift focus-ring z-20 grid size-10 place-items-center rounded-full text-foreground-soft transition-colors hover:text-foreground max-md:size-9';

function QuestionGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/** «?» on the home screen: the tour again, from its first message. */
export function OnboardingButton({ className }: { readonly className?: string }) {
  const { t } = useT('conversation');
  const { opened } = useOnboardingActions();
  return (
    <button
      type="button"
      aria-label={t('onboarding.open')}
      onClick={() => {
        board();
        opened();
      }}
      className={cn(helpClass, className)}
    >
      <QuestionGlyph />
    </button>
  );
}

function useAskWords(): (ask: TourAsk) => string {
  const { t } = useT('conversation');
  const f = useFormatters();
  return (ask) =>
    match(ask)
      .with('where', () => t('onboarding.ask.where'))
      .with('why', () => t('onboarding.ask.why'))
      .with('risk', () => t('onboarding.ask.risk'))
      .with('open', () => t('onboarding.ask.open', { coin: DEMO.coin, amount: f.usdWhole(DEMO.amount) }))
      .exhaustive();
}

/** How long the current beat has played, frame by frame until `until`; the clock starts again with every step. */
function useBeatClock(run: number, until: number, frozen: boolean): number {
  const [clock, setClock] = useState({ run, ms: 0 });
  useEffect(() => {
    if (frozen) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const ms = now - start;
      setClock({ run, ms });
      if (ms < until) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [run, until, frozen]);
  if (frozen) return Number.POSITIVE_INFINITY;
  return clock.run === run ? clock.ms : 0;
}

// The rest of the app sits still under the tour: everything beside the tour's own branch is inert and dimmed.
function useLockAround(stage: RefObject<HTMLElement | null>, locked: boolean) {
  useEffect(() => {
    const root = document.getElementById('root');
    if (!locked || !root) return;
    const held: Element[] = [];
    for (let node = stage.current; node && node !== root; node = node.parentElement)
      for (const sibling of node.parentElement?.children ?? [])
        if (sibling !== node && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          sibling.setAttribute('data-tour-locked', '');
          held.push(sibling);
        }
    return () => {
      for (const element of held) {
        element.removeAttribute('inert');
        element.setAttribute('data-tour-locked', 'off');
        window.setTimeout(() => {
          if (element.getAttribute('data-tour-locked') === 'off') element.removeAttribute('data-tour-locked');
        }, 600);
      }
    };
  }, [stage, locked]);
}

function useFollowEnd(feed: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = feed.current;
    if (!node) return;
    let last = node.offsetHeight;
    const observer = new ResizeObserver(() => {
      if (node.offsetHeight <= last) {
        last = node.offsetHeight;
        return;
      }
      last = node.offsetHeight;
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [feed]);
}

function UserLine({ text }: { readonly text: string }) {
  return (
    <div className={userBubbleClass}>
      <p className={bubbleBodyClass}>{text}</p>
    </div>
  );
}

function Draft({
  text,
  shown,
  hint,
}: {
  readonly text: string | null;
  readonly shown: number;
  readonly hint: string | null;
}) {
  const { t } = useT('conversation');
  if (text === null)
    return (
      <p className="flex min-h-10 items-center gap-2 px-3 py-2 text-base text-muted-foreground">
        {hint !== null && (
          <FastForward aria-hidden className="size-4 shrink-0 fill-current" strokeWidth={0} />
        )}
        {hint ?? t('composer.placeholder.none')}
      </p>
    );
  const typing = shown < text.length;
  return (
    <p className="min-h-10 px-3 py-2 text-base text-foreground">
      {shown === 0 ? (
        <span className="text-muted-foreground">{t('composer.placeholder.none')}</span>
      ) : (
        text.slice(0, shown)
      )}
      {typing && shown > 0 && (
        <span
          aria-hidden
          className="ms-px inline-block h-5 w-px translate-y-1 bg-foreground motion-safe:animate-pulse"
        />
      )}
    </p>
  );
}

/** The tour: a made-up conversation with the broker, step by step on «Next» and «Back», then the real home. */
export function OnboardingChat() {
  const { t } = useT('conversation');
  const { closed } = useOnboardingActions();
  const still = usePrefersReducedMotion();
  const words = useAskWords();
  const [state, dispatch] = useReducer(tourReducer, TOUR_START);
  const beat: TourBeat = beatAt(state.at) ?? 'signal';
  const next = beatAt(state.at + 1);
  const ask = next ? askOf(next) : null;
  const askText = ask ? words(ask) : null;
  const typeFrom = LANDS[beat] + TYPE_PAUSE_MS;
  const ms = useBeatClock(
    state.run,
    typeFrom + (askText?.length ?? 0) * TYPE_CHAR_MS,
    still || state.way === -1,
  );
  const shown =
    askText === null ? 0 : Math.min(askText.length, Math.max(0, Math.floor((ms - typeFrom) / TYPE_CHAR_MS)));
  const landed = ms >= LANDS[beat];
  const last = next === null;

  const stage = useRef<HTMLDivElement>(null);
  const feed = useRef<HTMLElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  const forward = useRef<HTMLButtonElement>(null);
  useFlight(glass, 'composer');
  useLockAround(stage, !state.leaving);
  useFollowEnd(feed);

  useEffect(() => {
    forward.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!state.leaving) return;
    const timer = window.setTimeout(
      () => {
        board();
        closed();
      },
      still ? 0 : LEAVE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [state.leaving, still, closed]);

  return (
    <div ref={stage} className="flex flex-1 flex-col">
      <section
        ref={feed}
        aria-label={t('onboarding.label')}
        className={cn(
          columnClass,
          'flex-1 justify-end px-4 pt-6 pb-6 transition-opacity duration-(--motion-duration-standard)',
          state.leaving && 'opacity-0',
        )}
      >
        <Entry who="note" follows={false} entering="still">
          <p className={noteLineClass}>{t('onboarding.example')}</p>
        </Entry>
        {TOUR_BEATS.slice(0, state.at + 1).map((name, index) => {
          const said = askOf(name);
          const current = index === state.at;
          return (
            <Fragment key={name}>
              {said && (
                <Entry
                  who="user"
                  follows={false}
                  entering={current && state.way === 1 && !still ? 'fresh' : 'still'}
                >
                  <UserLine text={words(said)} />
                </Entry>
              )}
              <Entry who="broker" follows={said !== null} entering="still">
                <BeatBody beat={name} ms={current ? ms : Number.POSITIVE_INFINITY} />
              </Entry>
            </Fragment>
          );
        })}
      </section>
      <div className={floorClass}>
        <div className={cn(columnClass, 'px-3 md:px-4')}>
          <div
            className={cn(
              'mb-2.5 flex items-center justify-between gap-3 ps-3 transition-opacity duration-(--motion-duration-standard)',
              state.leaving && 'opacity-0',
            )}
          >
            <div aria-hidden className="flex items-center gap-1.5">
              {TOUR_BEATS.map((name, index) => (
                <span
                  key={name}
                  className={cn(
                    'h-1.5 rounded-full transition-[width,background-color] duration-(--motion-duration-standard) motion-reduce:transition-none',
                    index === state.at ? 'w-4.5 bg-foreground' : 'w-1.5',
                    index !== state.at && (index < state.at ? 'bg-foreground/40' : 'bg-foreground/16'),
                  )}
                />
              ))}
            </div>
            <span className="sr-only">
              {t('onboarding.step', { n: state.at + 1, of: TOUR_BEATS.length })}
            </span>
            {!last && (
              <Button
                variant="ghost"
                size="sm"
                className="-me-1 text-muted-foreground hover:text-foreground"
                onClick={() => dispatch({ type: 'skip' })}
              >
                {t('onboarding.skip')}
              </Button>
            )}
          </div>
          <div ref={glass} className="glass-strong glass-lift flex flex-col gap-1 rounded-[1.375rem] p-2">
            <Draft
              text={askText}
              shown={shown}
              hint={next === 'payoff' && landed ? t('onboarding.skipTime', { count: DEMO.horizon }) : null}
            />
            <div className="flex items-center justify-between gap-2">
              {state.at > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'back' })}>
                  <ChevronLeft aria-hidden />
                  {t('onboarding.back')}
                </Button>
              ) : (
                <span />
              )}
              <Button ref={forward} size="sm" className="min-w-28" onClick={() => dispatch({ type: 'next' })}>
                {last ? t('onboarding.start') : t('onboarding.next')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
