import {
  settingRowBodyClass,
  settingRowClass,
  settingRowDescriptionClass,
  settingRowIconClass,
  settingRowLabelClass,
  settingRowTrailingClass,
} from '@reinforce/ui-primitives/setting-row';
import { cn } from '@reinforce/ui-styles/cn';
import type * as React from 'react';

type SettingRowProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  readonly icon?: React.ReactNode;
  readonly label: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly htmlFor?: string;
  readonly children?: React.ReactNode;
};

function SettingRow({ className, icon, label, description, htmlFor, children, ...props }: SettingRowProps) {
  return (
    <div data-slot="setting-row" className={cn(settingRowClass, className)} {...props}>
      {icon ? (
        <span data-slot="setting-row-icon" aria-hidden className={settingRowIconClass}>
          {icon}
        </span>
      ) : null}
      <div data-slot="setting-row-body" className={settingRowBodyClass}>
        {htmlFor === undefined ? (
          <span data-slot="setting-row-label" className={settingRowLabelClass}>
            {label}
          </span>
        ) : (
          <label data-slot="setting-row-label" htmlFor={htmlFor} className={settingRowLabelClass}>
            {label}
          </label>
        )}
        {description ? (
          <div data-slot="setting-row-description" className={settingRowDescriptionClass}>
            {description}
          </div>
        ) : null}
      </div>
      {children ? (
        <div data-slot="setting-row-trailing" className={settingRowTrailingClass}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export { SettingRow };
