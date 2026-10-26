import { Button } from '@reinforce/ui-react/button';
import { Moon, Sun } from 'lucide-react';
import { useResolvedTheme, useThemeActions } from '~/app/theme/theme-store';
import { useT } from '~/shared/i18n';

export function ThemeToggle() {
  const { t } = useT('shell');
  const dark = useResolvedTheme() === 'dark';
  const { themeSelected } = useThemeActions();
  const label = dark ? t('agents.strip.light') : t('agents.strip.dark');
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => themeSelected(dark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className="shrink-0 rounded-full text-muted-foreground"
    >
      {dark ? <Sun strokeWidth={1.75} /> : <Moon strokeWidth={1.75} />}
    </Button>
  );
}
