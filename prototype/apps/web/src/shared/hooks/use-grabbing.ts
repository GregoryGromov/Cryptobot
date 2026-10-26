import { useEffect } from 'react';

/** An open hand over a chart that can be pulled, a closed one while it is. */
export const grabClass = 'cursor-grab data-grabbing:cursor-grabbing';

/** Marks `host` with `data-grabbing` while a press holds it, for a chart pulled by hand to close its hand. */
export function useGrabbing(host: HTMLElement | null): void {
  useEffect(() => {
    if (!host) return;
    const grab = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button === 0) host.dataset.grabbing = '';
    };
    const release = () => {
      delete host.dataset.grabbing;
    };
    host.addEventListener('pointerdown', grab);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      host.removeEventListener('pointerdown', grab);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      release();
    };
  }, [host]);
}
