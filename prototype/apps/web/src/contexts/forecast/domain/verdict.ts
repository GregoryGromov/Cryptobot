import type { Cls, ForecastCheckStatus, Probs } from '@reinforce/server/dto';
import type { TFunction } from 'i18next';
import { match } from 'ts-pattern';

export const tenthsOf = (p: number): number => Math.round(p * 10);

const OUTCOMES = ['UP', 'FLAT', 'DOWN'] as const;

export const probabilityOf = (probs: Probs, cls: Cls): number =>
  match(cls)
    .with('UP', () => probs.p_up)
    .with('FLAT', () => probs.p_flat)
    .with('DOWN', () => probs.p_down)
    .exhaustive();

export type Lean = { readonly cls: Cls; readonly tenths: number } | null;

export const leanOf = (probs: Probs): Lean => {
  const ranked = OUTCOMES.map((cls) => ({ cls, tenths: tenthsOf(probabilityOf(probs, cls)) })).sort(
    (a, b) => b.tenths - a.tenths,
  );
  const [top, second] = ranked;
  if (!top || !second || top.tenths === second.tenths) return null;
  return top;
};

export const CLEAR_LEAN_TENTHS = 6;

export const leanWords = (t: TFunction<'format'>, probs: Probs): string => {
  const lean = leanOf(probs);
  if (!lean) return t('lean.unclear');
  const outcome = t(`outcome.${lean.cls}`);
  return lean.tenths >= CLEAR_LEAN_TENTHS ? t('lean.likely', { outcome }) : t('lean.slightly', { outcome });
};

export const horizonWords = (t: TFunction<'format'>, minutes: number): string =>
  minutes >= 60 ? t('horizon.hours', { n: minutes / 60 }) : t('horizon.minutes', { n: minutes });

export const untilWords = (t: TFunction<'format'>, span: (ms: number) => string, at: number, now: number) =>
  at <= now ? t('until.now') : t('until.future', { span: span(at - now) });

export const agoWords = (t: TFunction<'format'>, span: (ms: number) => string, at: number, now: number) =>
  now - at < 60_000 ? t('ago.now') : t('ago.past', { span: span(now - at) });

export const forecastCheckWords = (
  t: TFunction<'format'>,
  span: (ms: number) => string,
  check: { readonly status: ForecastCheckStatus; readonly checkAt: number },
  now: number,
  compact = false,
): string =>
  match(check.status)
    .with('waiting', () => {
      if (check.checkAt <= now) return t(compact ? 'check.waitingShort' : 'check.waiting');
      const until = untilWords(t, span, check.checkAt, now);
      return compact ? until : t('check.at', { until });
    })
    .with('pending-evaluation', () => t(compact ? 'check.waitingShort' : 'check.waiting'))
    .with('unresolved-data-quality', () => t(compact ? 'check.noPricesShort' : 'check.noPrices'))
    .with('not-prospective', () => t(compact ? 'check.notProspectiveShort' : 'check.notProspective'))
    .with('resolved', () => t('check.resolved'))
    .exhaustive();

export type Skill = { readonly n: number; readonly provisional: boolean; readonly skill: number | null };

const SKILL_MARGIN = 0.02;

export const skillWords = (t: TFunction<'format'>, h: Skill): string => {
  if (!h.n || h.provisional || h.skill === null) return t('skill.early');
  if (h.skill > SKILL_MARGIN) return t('skill.better');
  if (h.skill < -SKILL_MARGIN) return t('skill.worse');
  return t('skill.same');
};

export const recordWords = (t: TFunction<'format'>, h: Skill): string =>
  t('record', { skill: skillWords(t, h), checks: t('checks', { count: h.n }) });

export const checkWords = (t: TFunction<'format'>, lean: Cls | null, outcome: Cls | null): string => {
  if (!outcome) return t('verdict.noData');
  if (!lean) return t('verdict.noLean');
  if (lean === outcome) return t('verdict.right');
  return t('verdict.wrong', { outcome: t(`outcome.${lean}`) });
};

export type CheckMark = 'hit' | 'flat' | 'miss' | 'none';

export const checkMark = (lean: Cls | null, outcome: Cls | null): CheckMark => {
  if (!lean || !outcome) return 'none';
  if (lean === outcome) return 'hit';
  return outcome === 'FLAT' ? 'flat' : 'miss';
};

export const leanTenthsWords = (t: TFunction<'forecast'>, probs: Probs): string => {
  const lean = leanOf(probs);
  if (!lean) return t('lean.none');
  return t('lean.odds', { outcome: t(`lean.${lean.cls}`), n: lean.tenths });
};

export const termsWords = (t: TFunction<'format'>, minutes: readonly number[], and: string): string => {
  const words = minutes.map((m) => horizonWords(t, m));
  const last = words.at(-1) ?? '';
  return words.length > 1 ? `${words.slice(0, -1).join(', ')}${and}${last}` : last;
};
