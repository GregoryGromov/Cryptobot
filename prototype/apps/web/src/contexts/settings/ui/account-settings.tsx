import type { Session } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { useSignIn } from '~/contexts/account/ui/sign-in';
import { useSignOut } from '~/contexts/settings/api/use-account-actions';
import { useT } from '~/shared/i18n';
import { SettingItem, SettingsSection } from './settings-section';

export function AccountSettings({ user }: { readonly user: Session['user'] }) {
  const { t } = useT('settings');
  const { t: tc } = useT('common');
  const signIn = useSignIn();
  const { signOut, busy } = useSignOut();
  return (
    <SettingsSection title={t('account.title')}>
      <SettingItem>
        {user.guest ? (
          <SettingRow label={t('account.guest')} description={t('account.guestHint')}>
            <Button size="sm" onClick={signIn.start}>
              {tc('signIn')}
            </Button>
          </SettingRow>
        ) : (
          <SettingRow label={user.name || t('account.unnamed')} description={t('account.signedIn')}>
            <Button variant="secondary" size="sm" loading={busy} onClick={signOut}>
              {tc('signOut')}
            </Button>
          </SettingRow>
        )}
      </SettingItem>
    </SettingsSection>
  );
}
