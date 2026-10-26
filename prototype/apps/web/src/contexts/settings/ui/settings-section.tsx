import { sectionCardClass, sectionCardHeadClass } from '@reinforce/ui-primitives/card';
import { SettingRow } from '@reinforce/ui-react/setting-row';
import { Switch } from '@reinforce/ui-react/switch';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { type ReactNode, useId } from 'react';

export function SettingsSection({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn(sectionCardClass, 'px-4 pt-5 pb-1 sm:px-6')}>
      <div className={sectionCardHeadClass}>
        <Heading as="h2" size="section" id={id}>
          {title}
        </Heading>
      </div>
      <div className="mt-1 flex flex-col divide-y divide-foreground/7">{children}</div>
    </section>
  );
}

export function SettingItem({ children }: { readonly children: ReactNode }) {
  return <div className="flex flex-col gap-2 py-3.5">{children}</div>;
}

export function FieldProblem({ id, children }: { readonly id: string; readonly children: ReactNode }) {
  return (
    <p id={id} role="status" className="font-medium text-destructive text-xs leading-snug">
      {children}
    </p>
  );
}

export function SwitchSetting({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
}) {
  const id = useId();
  const hintId = useId();
  return (
    <SettingItem>
      <SettingRow htmlFor={id} label={label} description={<span id={hintId}>{hint}</span>}>
        <Switch id={id} checked={checked} aria-describedby={hintId} onCheckedChange={onCheckedChange} />
      </SettingRow>
    </SettingItem>
  );
}
