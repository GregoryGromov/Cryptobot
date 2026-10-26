import type { UiPreferences } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { Link } from '@tanstack/react-router';
import { useSavePreferences } from '~/contexts/settings/api/use-save-preferences';
import { useT } from '~/shared/i18n';
import { InstructionsSetting } from './instructions-setting';
import { ModeSetting } from './mode-setting';
import { SettingItem, SettingsSection } from './settings-section';
import { TradeCapSetting } from './trade-cap-setting';

export function BrokerSettings({ preferences }: { readonly preferences: UiPreferences }) {
  const { t } = useT('settings');
  const save = useSavePreferences();
  const followed = preferences.markets.length;
  return (
    <SettingsSection title={t('broker.title')}>
      <ModeSetting />
      <InstructionsSetting />
      <SettingItem>
        <SettingRow
          label={t('broker.markets')}
          description={followed > 0 ? t('broker.marketsCount', { count: followed }) : t('broker.marketsNone')}
        >
          <Button asChild variant="secondary" size="sm">
            <Link to="/markets">{t('broker.choose')}</Link>
          </Button>
        </SettingRow>
      </SettingItem>
      <TradeCapSetting value={preferences.maxTradeUsd} onCommit={(maxTradeUsd) => save({ maxTradeUsd })} />
    </SettingsSection>
  );
}
