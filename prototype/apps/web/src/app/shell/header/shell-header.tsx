import { Button } from '@reinforce/ui-react/button';
import { Menu } from 'lucide-react';
import { useT } from '~/shared/i18n';
import { useShellActions } from '../shell-store';
import { HeadBar } from './head-bar';
import { WalletStrip } from './wallet-strip';

export function ShellHeader() {
  const { t } = useT('shell');
  const { navigationOpened } = useShellActions();
  return (
    <HeadBar className="z-30">
      <Button
        variant="ghost"
        size="icon-md"
        onClick={navigationOpened}
        aria-label={t('side.open')}
        className="shrink-0 rounded-full md:hidden"
      >
        <Menu aria-hidden />
      </Button>
      <WalletStrip className="ms-auto" />
    </HeadBar>
  );
}
