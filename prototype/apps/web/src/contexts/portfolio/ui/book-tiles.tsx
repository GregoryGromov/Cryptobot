import type { Trades } from '@reinforce/server/dto';
import { cardVariants, stageClass } from '@reinforce/ui-primitives/card';
import { figureFractionClass, splitFigure } from '@reinforce/ui-primitives/figure';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { directionOf } from '~/shared/format/percent';
import { useFormatters } from '~/shared/format/use-formatters';
import { useIntlLocale, useT } from '~/shared/i18n';
import { Numeral } from '~/shared/ui/numeral';
import type { BookKey } from '../domain/book-vm';
import { BOOKS } from '../domain/portfolio-search';

export const TILES_CLASS = 'grid gap-2';
export const TILES_COLUMN_CLASS = 'grid grid-cols-2 gap-2 @2xl:grid-cols-1';
export const TILE_CLASS =
  '@container flex min-w-0 flex-col justify-center gap-1 rounded-(--radius-card) px-3.5 py-3.5';
export const TILE_FIGURE_CLASS =
  'whitespace-nowrap font-figure font-semibold text-lg tracking-[-0.01em] @[11.5rem]:text-2xl';

function TileFigure({ text }: { readonly text: string }) {
  const { whole, fraction, tail } = splitFigure(text, useIntlLocale());
  return (
    <span className={TILE_FIGURE_CLASS}>
      {whole}
      {fraction !== '' && <span className={figureFractionClass}>{fraction}</span>}
      {tail}
    </span>
  );
}

export function BookTiles({ trades, picked }: { readonly trades: Trades; readonly picked: BookKey }) {
  const { t } = useT('portfolio');
  const fmt = useFormatters();
  return (
    <nav aria-label={t('switch')} className={TILES_CLASS}>
      {BOOKS.map((key) => {
        const { nav, returnPct } = trades[key];
        const current = key === picked;
        return (
          <Link
            key={key}
            to="/portfolio"
            search={(prev) => ({ ...prev, book: key })}
            replace
            resetScroll={false}
            aria-current={current ? 'page' : undefined}
            className={cn(
              current ? stageClass : cardVariants({ size: 'sm', interactive: true }),
              TILE_CLASS,
              'focus-ring',
              current ? 'text-foreground' : 'text-foreground-soft',
            )}
          >
            <span className="flex items-baseline justify-between gap-2 text-meta">
              <span className={cn('truncate', current ? 'font-medium' : 'text-muted-foreground')}>
                {t(`books.${key}.label`)}
              </span>
              {returnPct !== null && (
                <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-muted-foreground">{t('stats.pnl')}</span>
                  <Numeral tone="direction" direction={directionOf(returnPct, 2)}>
                    {fmt.change(returnPct, 2)}
                  </Numeral>
                </span>
              )}
            </span>
            {nav === null ? (
              <span className="text-meta text-muted-foreground">{t('stats.unvalued')}</span>
            ) : (
              <TileFigure text={fmt.usd(nav)} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
