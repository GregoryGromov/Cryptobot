import type { UiPreferences } from '@reinforce/server/dto';
import { Label } from '@reinforce/ui-react/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@reinforce/ui-react/select';
import { Text } from '@reinforce/ui-react/typography';
import { useId } from 'react';
import { HOURS } from '~/contexts/settings/domain/limits';
import type { QuietPatch } from '~/contexts/settings/domain/preferences-patch';
import { quietPatch } from '~/contexts/settings/domain/preferences-patch';
import { browserTimeZone, hourInstant } from '~/contexts/settings/domain/quiet-hours';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';
import { SwitchSetting } from './settings-section';

type Quiet = UiPreferences['quiet'];

export function QuietHours({
  quiet,
  onChange,
}: {
  readonly quiet: Quiet;
  readonly onChange: (quiet: QuietPatch) => void;
}) {
  const { t } = useT('settings');
  const change = (next: Quiet) => onChange(quietPatch(next, browserTimeZone()));
  return (
    <>
      <SwitchSetting
        label={t('telegram.quiet')}
        hint={t('telegram.quietHint')}
        checked={quiet.on}
        onCheckedChange={(on) => change({ ...quiet, on })}
      />
      {quiet.on && (
        <div className="flex flex-col gap-2 py-3.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <HourSelect
              label={t('telegram.from')}
              hour={quiet.from}
              onPick={(from) => change({ ...quiet, from })}
            />
            <HourSelect label={t('telegram.to')} hour={quiet.to} onPick={(to) => change({ ...quiet, to })} />
          </div>
          <Text variant="muted" className="text-xs">
            {t('telegram.zone', { tz: quiet.tz })}
          </Text>
        </div>
      )}
    </>
  );
}

function HourSelect({
  label,
  hour,
  onPick,
}: {
  readonly label: string;
  readonly hour: number;
  readonly onPick: (hour: number) => void;
}) {
  const id = useId();
  const { clock } = useFormatters();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={String(hour)} onValueChange={(value) => onPick(Number(value))}>
        <SelectTrigger id={id} className="min-w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {clock(hourInstant(option))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
