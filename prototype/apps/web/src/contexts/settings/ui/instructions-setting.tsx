import { Button } from '@reinforce/ui-react/button';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { Link } from '@tanstack/react-router';
import { useVersionWords } from '~/contexts/broker/ui/use-version-words';
import { useT } from '~/shared/i18n';
import { SettingItem } from './settings-section';

export function InstructionsSetting() {
  const { t } = useT('settings');
  const version = useVersionWords();
  return (
    <SettingItem>
      <SettingRow label={t('broker.instructions')} description={version ?? t('broker.instructionsHint')}>
        <Button asChild variant="secondary" size="sm">
          <Link to="/settings/instructions">{t('broker.change')}</Link>
        </Button>
      </SettingRow>
    </SettingItem>
  );
}
