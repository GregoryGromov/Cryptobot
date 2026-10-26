import { Heading, Text } from '@reinforce/ui-react/typography';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { useT } from '~/shared/i18n';
import { AppBoundary } from '~/shared/ui/app-boundary';
import { dataColumnClass } from '~/shared/ui/page-column';
import { BrokerInstructions } from './broker-instructions';
import { useVersionWords } from './use-version-words';

export function InstructionsPage() {
  const { t } = useT('broker');
  const { t: common } = useT('common');
  const version = useVersionWords();
  return (
    <div className={dataColumnClass}>
      <Link
        to="/settings"
        className="focus-ring -ms-1 inline-flex items-center gap-0.5 self-start rounded-sm font-medium text-meta text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft aria-hidden className="size-4" />
        {common('nav.settings')}
      </Link>
      <header className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <Heading as="h1" size="page">
          {t('instructions.title')}
        </Heading>
        {version !== null && (
          <Text variant="muted" className="font-medium text-meta">
            {version}
          </Text>
        )}
      </header>
      <AppBoundary tier="section" scope="broker-instructions">
        <BrokerInstructions />
      </AppBoundary>
    </div>
  );
}
