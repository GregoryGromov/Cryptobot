import { SettingRow } from '@reinforce/ui-react/setting-row';
import { Skeleton, SkeletonLines } from '@reinforce/ui-react/skeleton';
import { useT } from '~/shared/i18n';
import { SettingItem, SettingsSection } from './settings-section';

export function SettingsSkeleton() {
  const { t } = useT('settings');
  const brokerRows = [t('broker.mode'), t('broker.instructions'), t('broker.markets'), t('broker.maxTrade')];
  const telegramRows = [t('telegram.unlinked'), t('telegram.ideas'), t('telegram.actionable')];
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <SettingsSection title={<SkeletonLines>{t('broker.title')}</SkeletonLines>}>
        {brokerRows.map((label) => (
          <SkeletonRow key={label} label={label} />
        ))}
      </SettingsSection>
      <SettingsSection title={<SkeletonLines>{t('telegram.title')}</SkeletonLines>}>
        {telegramRows.map((label) => (
          <SkeletonRow key={label} label={label} />
        ))}
      </SettingsSection>
    </div>
  );
}

function SkeletonRow({ label }: { readonly label: string }) {
  return (
    <SettingItem>
      <SettingRow
        label={<SkeletonLines>{label}</SkeletonLines>}
        description={<Skeleton className="h-3 w-48" />}
      >
        <Skeleton className="h-6.5 w-11 rounded-full" />
      </SettingRow>
    </SettingItem>
  );
}
