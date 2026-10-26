import type { AgentView } from '@reinforce/server/dto';
import { sectionCardClass, sectionCardHeadClass } from '@reinforce/ui-primitives/card';
import {
  listRowCopyClass,
  listRowMetaVariants,
  listRowTitleVariants,
  listRowVariants,
} from '@reinforce/ui-primitives/list-row';
import { Badge } from '@reinforce/ui-react/badge';
import { Button } from '@reinforce/ui-react/button';
import { Heading } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { useId } from 'react';
import { useActivateVersion } from '~/contexts/broker/api/use-broker-versions';
import { useFormatters } from '~/shared/format/use-formatters';
import { useT } from '~/shared/i18n';

type Version = AgentView['versions'][number];

export function VersionList({ versions }: { readonly versions: readonly Version[] }) {
  const { t } = useT('broker');
  const { activate, activating } = useActivateVersion();
  const id = useId();
  const activeId = versions.find((version) => version.active)?.id ?? null;
  const ordered = versions.toSorted((a, b) => b.n - a.n);
  return (
    <section aria-labelledby={id} className={cn(sectionCardClass, 'flex flex-col gap-1 px-4 pb-3 sm:px-6')}>
      <div className={sectionCardHeadClass}>
        <Heading as="h2" size="section" id={id}>
          {t('versions.title')}
        </Heading>
      </div>
      <ul className="flex flex-col">
        {ordered.map((version) => (
          <li key={version.id} className={cn(listRowVariants(), 'grid-cols-[minmax(0,1fr)_auto]')}>
            <VersionCopy version={version} />
            {!version.active && activeId !== null && (
              <Button
                variant="secondary"
                size="sm"
                loading={activating === version.id}
                disabled={activating !== null}
                aria-label={t('versions.activateLabel', { n: version.n })}
                onClick={() => activate(version.id, activeId)}
              >
                {t('versions.activate')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function VersionCopy({ version }: { readonly version: Version }) {
  const { t } = useT('broker');
  const { day } = useFormatters();
  const description = version.note || (version.n === 1 ? t('versions.standard') : t('versions.blank'));
  return (
    <span className={listRowCopyClass}>
      <span className="flex items-center gap-2">
        <span className={listRowTitleVariants()}>{t('versions.name', { n: version.n })}</span>
        {version.active && (
          <Badge variant="secondary" size="sm">
            {t('versions.on')}
          </Badge>
        )}
      </span>
      <span className={cn(listRowMetaVariants(), 'whitespace-normal')}>{description}</span>
      <span className={cn(listRowMetaVariants(), 'flex gap-2')}>
        <span>{day(version.createdAt)}</span>
        <span>{t('versions.count', { count: version.forecasts })}</span>
        <span>{version.modelId}</span>
      </span>
    </span>
  );
}
