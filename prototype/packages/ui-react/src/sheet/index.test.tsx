import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './index.js';

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount();
});

describe('SheetContent', () => {
  it('announces the close button with consumer copy', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    mounted.push(() => {
      void act(() => root.unmount());
      host.remove();
    });

    await act(async () => {
      root.render(
        <Sheet open>
          <SheetContent closeButton={{ label: 'Schließen' }}>
            <SheetTitle>Wallet</SheetTitle>
            <SheetDescription>Details</SheetDescription>
          </SheetContent>
        </Sheet>,
      );
    });

    expect(document.querySelector('[data-slot="sheet-close"]')?.textContent).toBe('Schließen');
  });
});
