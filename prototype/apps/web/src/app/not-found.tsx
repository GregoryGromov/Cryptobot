import { brandMarkPath, brandMarkViewBox } from '@reinforce/ui-primitives/brand';
import { stageClass } from '@reinforce/ui-primitives/card';
import {
  notFoundDigitClass,
  notFoundFigureVariants,
  notFoundMarkCanvasClass,
  notFoundMarkClass,
  notFoundMarkFallbackClass,
  notFoundPlaneClass,
} from '@reinforce/ui-primitives/not-found-scene';
import { Button } from '@reinforce/ui-react/button';
import { Heading, Text } from '@reinforce/ui-react/typography';
import { cn } from '@reinforce/ui-styles/cn';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useT } from '~/shared/i18n';
import { personalColumnClass } from '~/shared/ui/page-column';

export function NotFound() {
  const { t } = useT('common');
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scene.current;
    if (!root) return;
    let active = true;
    let dispose: (() => void) | undefined;
    void import('@reinforce/ui-primitives/not-found-scene/animation').then(({ mountNotFoundScene }) => {
      if (active) dispose = mountNotFoundScene(root);
    });
    return () => {
      active = false;
      dispose?.();
    };
  }, []);
  return (
    <div className={cn(personalColumnClass, 'items-center')}>
      <div
        ref={scene}
        className={cn(
          stageClass,
          'flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-8 text-center md:gap-6 md:px-12 md:py-14',
        )}
      >
        <div className={notFoundFigureVariants({ size: 'hero' })} aria-hidden="true">
          <div className={notFoundPlaneClass} data-nfs-plane>
            <span className={notFoundDigitClass}>4</span>
            <span className={notFoundMarkClass}>
              <svg
                className={notFoundMarkFallbackClass}
                viewBox={brandMarkViewBox}
                fill="currentColor"
                aria-hidden="true"
                data-nfs-fallback
              >
                <path d={brandMarkPath} />
              </svg>
              <canvas className={notFoundMarkCanvasClass} data-nfs-canvas />
            </span>
            <span className={notFoundDigitClass}>4</span>
          </div>
        </div>
        <Heading as="h1" size="h1">
          {t('router.notFoundTitle')}
        </Heading>
        <Text variant="lead" className="max-w-md">
          {t('router.notFoundBody')}
        </Text>
        <Button asChild size="lg">
          <Link to="/">{t('router.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
