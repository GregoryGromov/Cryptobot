import { brandMarkPath, brandMarkViewBox } from '@reinforce/ui-primitives/brand';

export function BrandMark({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox={brandMarkViewBox} fill="currentColor" aria-hidden="true">
      <path d={brandMarkPath} />
    </svg>
  );
}
