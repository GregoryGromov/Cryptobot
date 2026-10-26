import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { useT } from '~/shared/i18n';
import { BrandMark } from '~/shared/ui/brand-mark';
import { railLabelClass, railSlotClass } from './rail';

export function SidebarBrand({
  expanded,
  onNavigate,
  className,
}: {
  readonly expanded: boolean;
  readonly onNavigate?: () => void;
  readonly className?: string;
}) {
  const { t } = useT('shell');
  return (
    <Link
      to="/"
      onClick={onNavigate}
      aria-label={t('home')}
      className={cn(
        'focus-ring flex w-full min-w-0 items-center rounded-md transition-opacity duration-(--motion-duration-quick) ease-standard motion-reduce:transition-none',
        expanded && 'pe-9',
        className,
      )}
    >
      <span className={railSlotClass(expanded)}>
        <BrandMark className="size-8 shrink-0 text-primary" />
      </span>
      <span
        className={cn(
          railLabelClass(expanded),
          'ps-1.5 font-bold text-foreground text-lg leading-[1.375rem] tracking-[-0.02em]',
        )}
      >
        Wealth <span className="text-primary">Co-Pilot</span>
      </span>
    </Link>
  );
}
