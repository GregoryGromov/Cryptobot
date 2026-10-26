import { SettingRow } from '@reinforce/ui-react/setting-row';
import { ToggleGroup, ToggleGroupItem } from '@reinforce/ui-react/toggle-group';
import { type LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { useId } from 'react';
import { type Theme, useTheme, useThemeActions } from '~/app/theme/theme-store';
import { useLocaleChoice } from '~/contexts/settings/api/use-account-actions';
import { LOCALES, useLocale, useT } from '~/shared/i18n';
import { SettingItem, SettingsSection } from './settings-section';

const THEMES = [
  { theme: 'light', Icon: Sun },
  { theme: 'dark', Icon: Moon },
  { theme: 'system', Icon: Monitor },
] as const satisfies readonly { readonly theme: Theme; readonly Icon: LucideIcon }[];

export function AppearanceSettings() {
  const { t } = useT('settings');
  const theme = useTheme();
  const { themeSelected } = useThemeActions();
  const locale = useLocale();
  const chooseLocale = useLocaleChoice();
  const themeId = useId();
  const localeId = useId();
  const localeHintId = useId();
  return (
    <SettingsSection title={t('appearance.title')}>
      <SettingItem>
        <SettingRow label={<span id={themeId}>{t('appearance.theme')}</span>} className="flex-wrap">
          <ToggleGroup
            type="single"
            aria-labelledby={themeId}
            value={theme}
            onValueChange={(value) => {
              const picked = THEMES.find((option) => option.theme === value);
              if (picked) themeSelected(picked.theme);
            }}
          >
            {THEMES.map(({ theme: option, Icon }) => (
              <ToggleGroupItem key={option} value={option}>
                <Icon aria-hidden />
                {t(`appearance.themes.${option}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SettingRow>
      </SettingItem>
      <SettingItem>
        <SettingRow
          label={<span id={localeId}>{t('appearance.language')}</span>}
          description={<span id={localeHintId}>{t('appearance.languageHint')}</span>}
          className="flex-wrap"
        >
          <ToggleGroup
            type="single"
            aria-labelledby={localeId}
            aria-describedby={localeHintId}
            value={locale}
            onValueChange={(value) => {
              const picked = LOCALES.find((option) => option === value);
              if (picked && picked !== locale) chooseLocale(picked);
            }}
          >
            {LOCALES.map((option) => (
              <ToggleGroupItem key={option} value={option} lang={option}>
                {t(`appearance.languages.${option}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SettingRow>
      </SettingItem>
    </SettingsSection>
  );
}
