import type { UiPreferences } from '@reinforce/server/dto';
import type { AppRouter } from '@reinforce/server/router';
import type { inferRouterInputs } from '@trpc/server';

type PreferencesInput = inferRouterInputs<AppRouter>['broker']['preferences'];

export type PreferencesPatch = Extract<PreferencesInput, { kind: 'patch' }>['patch'];

export type QuietPatch = NonNullable<PreferencesPatch['quiet']>;

export const applyPatch = (prefs: UiPreferences, patch: PreferencesPatch): UiPreferences => ({
  classes: prefs.classes,
  markets: patch.markets ?? prefs.markets,
  mode: patch.mode ?? prefs.mode,
  maxTradeUsd: patch.maxTradeUsd === undefined ? prefs.maxTradeUsd : Number(patch.maxTradeUsd),
  analysisLimit: patch.analysisLimit ?? prefs.analysisLimit,
  ideaLimit: patch.ideaLimit ?? prefs.ideaLimit,
  autoAnalysis: patch.autoAnalysis ?? prefs.autoAnalysis,
  alerts: patch.alerts ?? prefs.alerts,
  actionableOnly: patch.actionableOnly ?? prefs.actionableOnly,
  quiet: patch.quiet
    ? { on: patch.quiet.enabled, from: patch.quiet.from, to: patch.quiet.to, tz: patch.quiet.timezone }
    : prefs.quiet,
  style: patch.style ?? prefs.style,
});

const FIELDS = [
  'markets',
  'mode',
  'maxTradeUsd',
  'analysisLimit',
  'ideaLimit',
  'autoAnalysis',
  'alerts',
  'actionableOnly',
  'quiet',
  'style',
] as const satisfies readonly (keyof UiPreferences)[];

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

const withField = <K extends keyof UiPreferences>(
  prefs: UiPreferences,
  key: K,
  value: UiPreferences[K],
): UiPreferences => ({ ...prefs, [key]: value });

export const revertPatch = (
  current: UiPreferences,
  before: UiPreferences,
  patch: PreferencesPatch,
): UiPreferences => {
  const applied = applyPatch(before, patch);
  return FIELDS.reduce(
    (prefs, key) =>
      same(applied[key], before[key]) || !same(prefs[key], applied[key])
        ? prefs
        : withField(prefs, key, before[key]),
    current,
  );
};

export const quietPatch = (quiet: UiPreferences['quiet'], timezone: string): QuietPatch => ({
  enabled: quiet.on,
  from: quiet.from,
  to: quiet.to,
  timezone,
});
