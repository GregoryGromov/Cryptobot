import { inlineNoteContentVariants, inlineNoteVariants } from '@reinforce/ui-primitives/inline-note';
import { Alert, AlertDescription, AlertTitle } from '@reinforce/ui-react/alert';
import { Button } from '@reinforce/ui-react/button';
import { Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { CloudOff, type LucideIcon, TriangleAlert, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { match, P } from 'ts-pattern';
import { classifyDisplayFault, type DisplayFaultCause } from '~/shared/api/error-map';
import { useConnectivityKind } from '~/shared/connectivity/connectivity-store';
import { useT } from '~/shared/i18n';

export function FaultState({
  title,
  onRetry,
  cause,
  ghost,
}: {
  readonly title: string;
  readonly onRetry?: () => void;
  readonly cause?: DisplayFaultCause;
  readonly ghost?: ReactNode;
}) {
  const kind = useConnectivityKind();
  const { t } = useT('errors');
  return match(classifyDisplayFault(cause, kind))
    .with('offline', () => (
      <GhostOverlay ghost={ghost} icon={WifiOff} title={t('offlineTitle')} body={t('offlineBody')} />
    ))
    .with('unreachable', () => (
      <GhostOverlay
        ghost={ghost}
        icon={CloudOff}
        title={t('unreachableTitle')}
        body={t('unreachableBody')}
        onRetry={onRetry}
      />
    ))
    .with(P.union('server', 'client'), () =>
      ghost ? (
        <GhostOverlay ghost={ghost} icon={TriangleAlert} title={title} tone="destructive" onRetry={onRetry} />
      ) : (
        <Alert data-testid="fault-state" variant="destructive">
          <TriangleAlert />
          <AlertTitle>{title}</AlertTitle>
          {onRetry && (
            <AlertDescription>
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {t('retry')}
              </Button>
            </AlertDescription>
          )}
        </Alert>
      ),
    )
    .exhaustive();
}

function GhostOverlay({
  ghost,
  icon: Icon,
  title,
  body,
  onRetry,
  tone = 'neutral',
}: {
  readonly ghost?: ReactNode;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly body?: string;
  readonly onRetry?: () => void;
  readonly tone?: 'neutral' | 'destructive';
}) {
  const { t } = useT('errors');
  return (
    <div data-testid="fault-state" data-fault="" className="flex flex-col gap-3">
      <div
        role="status"
        className={cn(
          inlineNoteVariants({ tone: tone === 'destructive' ? 'warning' : 'neutral' }),
          'items-center',
        )}
      >
        <Icon strokeWidth={1.875} />
        <div className={inlineNoteContentVariants()}>
          <Text className="font-medium text-sm">{title}</Text>
          {body && (
            <Text variant="muted" className="text-xs">
              {body}
            </Text>
          )}
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t('retry')}
          </Button>
        )}
      </div>
      {ghost && (
        <div aria-hidden inert className="pointer-events-none select-none">
          {ghost}
        </div>
      )}
    </div>
  );
}
