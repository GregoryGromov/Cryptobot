import { MODE_HORIZON, TRADING_MODES } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@reinforce/ui-react/dropdown-menu';
import { Check, ChevronDown, Timer } from 'lucide-react';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useSavePreferences } from '~/contexts/settings/api/use-save-preferences';
import { useTradingMode } from '~/shared/api/trading-mode';
import { useT } from '~/shared/i18n';

export function ModePicker() {
  const { t } = useT('settings');
  const { t: tf } = useT('format');
  const { mode } = useTradingMode();
  const save = useSavePreferences();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title={t('broker.modeHint')}
          className="text-muted-foreground"
        >
          <Timer aria-hidden />
          <span className="max-sm:sr-only">{t(`broker.modes.${mode}`)}</span>
          <span className="font-figure">{horizonWords(tf, MODE_HORIZON[mode])}</span>
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
          {t('broker.modeHint')}
        </DropdownMenuLabel>
        {TRADING_MODES.map((option) => (
          <DropdownMenuItem
            key={option}
            aria-current={option === mode || undefined}
            onSelect={() => {
              if (option !== mode) save({ mode: option });
            }}
          >
            <span className="flex min-w-0 flex-1 items-baseline gap-1.5 font-medium text-foreground">
              {t(`broker.modes.${option}`)}
              <span className="font-figure font-normal text-muted-foreground text-xs">
                {horizonWords(tf, MODE_HORIZON[option])}
              </span>
            </span>
            {option === mode && (
              <Check aria-hidden strokeWidth={2} className="size-4 shrink-0 text-foreground" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
