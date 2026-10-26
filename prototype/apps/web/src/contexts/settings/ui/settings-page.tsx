import { Heading, Text } from '@reinforce/ui-react/typography';
import { useIsMutating } from '@tanstack/react-query';
import { useSession } from '~/shared/api/session';
import { trpc } from '~/shared/api/trpc';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { AsyncView } from '~/shared/ui/async-view';
import { personalColumnClass } from '~/shared/ui/page-column';
import { AccountSettings } from './account-settings';
import { AppearanceSettings } from './appearance-settings';
import { BrokerSettings } from './broker-settings';
import { SettingsSkeleton } from './settings-skeleton';
import { TelegramSettings } from './telegram-settings';

export function SettingsPage() {
  const { t } = useT('settings');
  const session = useSession();
  const saving = useIsMutating({ mutationKey: trpc.broker.preferences.mutationKey() }) > 0;
  return (
    <div className={personalColumnClass}>
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <Heading as="h1" size="page">
            {t('title')}
          </Heading>
          <span role="status" className="text-meta text-muted-foreground">
            {saving ? t('saving') : ''}
          </span>
        </div>
        <Text variant="muted">{t('lead')}</Text>
      </header>
      <AsyncView query={session} errorTitle={t('failed')} loading={<SettingsSkeleton />}>
        {(data) => (
          <>
            <AppBoundary tier="section" scope="settings-broker">
              <BrokerSettings preferences={data.preferences} />
            </AppBoundary>
            <AppBoundary tier="section" scope="settings-telegram">
              <TelegramSettings session={data} />
            </AppBoundary>
            <AppBoundary tier="section" scope="settings-account">
              <AccountSettings user={data.user} />
            </AppBoundary>
          </>
        )}
      </AsyncView>
      <AppBoundary tier="section" scope="settings-appearance">
        <AppearanceSettings />
      </AppBoundary>
      <Text variant="muted" className="px-1 text-meta">
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-foreground hover:underline"
        >
          {t('chartsBy')}
        </a>
      </Text>
    </div>
  );
}
