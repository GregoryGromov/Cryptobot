import { MODE_HORIZON, TRADING_MODES } from '@reinforce/server/dto';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { useId } from 'react';
import { horizonWords } from '~/contexts/forecast/domain/verdict';
import { useSavePreferences } from '~/contexts/settings/api/use-save-preferences';
import { useTradingMode } from '~/shared/api/trading-mode';
import { useT } from '~/shared/i18n';
import { SettingItem } from './settings-section';

export function ModeSetting() {
  const { t } = useT('settings');
  const { t: tf } = useT('format');
  const { mode } = useTradingMode();
  const save = useSavePreferences();
  const labelId = useId();
  const hintId = useId();
  return (
    <SettingItem>
      <SettingRow
        label={<span id={labelId}>{t('broker.mode')}</span>}
        description={<span id={hintId}>{t('broker.modeHint')}</span>}
        className="flex-wrap max-sm:*:data-[slot=setting-row-trailing]:basis-full"
      >
        <ToggleGroup
          type="single"
          aria-labelledby={labelId}
          aria-describedby={hintId}
          value={mode}
          className="w-full sm:w-fit"
          onValueChange={(value) => {
            const picked = TRADING_MODES.find((option) => option === value);
            if (picked && picked !== mode) save({ mode: picked });
          }}
        >
          {TRADING_MODES.map((option) => (
            <ToggleGroupItem key={option} value={option} className="flex-1 gap-1.5 sm:flex-none">
              {t(`broker.modes.${option}`)}
              <span className="font-figure font-normal text-muted-foreground">
                {horizonWords(tf, MODE_HORIZON[option])}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingRow>
    </SettingItem>
  );
}
