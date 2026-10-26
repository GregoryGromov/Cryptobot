import type { Session } from '@reinforce/server/dto';
import { Button } from '@reinforce/ui-react/button';
import { InlineNote } from '@reinforce/ui-react/inline-note';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { useSignIn } from '~/contexts/account/ui/sign-in';
import { useTelegramLink } from '~/contexts/settings/api/use-account-actions';
import { useSavePreferences } from '~/contexts/settings/api/use-save-preferences';
import { IDEA_LIMIT } from '~/contexts/settings/domain/limits';
import { useT } from '~/shared/i18n';
import { CountSetting } from './count-setting';
import { QuietHours } from './quiet-hours';
import { SettingItem, SettingsSection, SwitchSetting } from './settings-section';

export function TelegramSettings({ session }: { readonly session: Session }) {
  const { t } = useT('settings');
  const save = useSavePreferences();
  const preferences = session.preferences;
  if (!session.telegram.available)
    return (
      <SettingsSection title={t('telegram.title')}>
        <SettingItem>
          <InlineNote tone="neutral">{t('telegram.unavailable')}</InlineNote>
        </SettingItem>
      </SettingsSection>
    );
  return (
    <SettingsSection title={t('telegram.title')}>
      {session.user.guest ? <GuestLink /> : <TelegramLink telegram={session.telegram} />}
      <SwitchSetting
        label={t('telegram.ideas')}
        hint={t('telegram.ideasHint')}
        checked={preferences.alerts}
        onCheckedChange={(alerts) => save({ alerts })}
      />
      <SwitchSetting
        label={t('telegram.actionable')}
        hint={t('telegram.actionableHint')}
        checked={preferences.actionableOnly}
        onCheckedChange={(actionableOnly) => save({ actionableOnly })}
      />
      <CountSetting
        label={t('telegram.perDay')}
        hint={t('telegram.perDayHint')}
        value={preferences.ideaLimit}
        bounds={IDEA_LIMIT}
        onCommit={(ideaLimit) => save({ ideaLimit })}
      />
      <QuietHours quiet={preferences.quiet} onChange={(quiet) => save({ quiet })} />
    </SettingsSection>
  );
}

function GuestLink() {
  const { t } = useT('settings');
  const { t: tc } = useT('common');
  const signIn = useSignIn();
  return (
    <SettingItem>
      <SettingRow label={t('telegram.unlinked')} description={t('telegram.guest')}>
        <Button variant="secondary" size="sm" onClick={signIn.start}>
          {tc('signIn')}
        </Button>
      </SettingRow>
    </SettingItem>
  );
}

function TelegramLink({ telegram }: { readonly telegram: Session['telegram'] }) {
  const { t } = useT('settings');
  const link = useTelegramLink();
  if (telegram.linked)
    return (
      <SettingItem>
        <SettingRow
          label={
            telegram.username
              ? t('telegram.linkedWith', { username: telegram.username })
              : t('telegram.linked')
          }
          description={t('telegram.linkedHint')}
        >
          <Button variant="secondary" size="sm" loading={link.busy} onClick={link.unlink}>
            {t('telegram.unlink')}
          </Button>
        </SettingRow>
      </SettingItem>
    );
  return (
    <SettingItem>
      <SettingRow label={t('telegram.unlinked')} description={t('telegram.unlinkedHint')}>
        <Button size="sm" loading={link.busy} onClick={link.start}>
          {telegram.bot ? t('telegram.linkWith', { bot: telegram.bot }) : t('telegram.link')}
        </Button>
      </SettingRow>
    </SettingItem>
  );
}
