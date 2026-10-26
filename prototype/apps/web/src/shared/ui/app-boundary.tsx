import { Button } from '@reinforce/ui-react/button';
import { TriangleAlert } from 'lucide-react';
import { Component, type ReactNode } from 'react';
import { useT } from '~/shared/i18n';

type BoundaryTier = 'root' | 'section' | 'panel';

type Props = {
  readonly tier: BoundaryTier;
  readonly scope: string;
  readonly fallback?: (reset: () => void) => ReactNode;
  readonly children: ReactNode;
};

export class AppBoundary extends Component<Props, { readonly failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    console.error(`[boundary:${this.props.tier}:${this.props.scope}]`, error);
  }

  reset = (): void => this.setState({ failed: false });

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset);
    return this.props.tier === 'root' ? <CrashScreen /> : <SectionFault reset={this.reset} />;
  }
}

function SectionFault({ reset }: { readonly reset: () => void }) {
  const { t } = useT('errors');
  return (
    <div
      role="alert"
      className="glass flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center"
    >
      <TriangleAlert className="size-5 text-destructive" strokeWidth={1.875} />
      <p className="text-muted-foreground text-sm">{t('section')}</p>
      <Button variant="secondary" size="sm" onClick={reset}>
        {t('retry')}
      </Button>
    </div>
  );
}

function CrashScreen() {
  return (
    <div role="alert" className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-semibold text-xl">Something went wrong · Что-то пошло не так</h1>
      <button
        type="button"
        className="rounded-md border px-4 py-2 text-sm"
        onClick={() => window.location.reload()}
      >
        Reload · Обновить
      </button>
    </div>
  );
}
