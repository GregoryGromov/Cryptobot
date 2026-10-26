import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './index.js';

const mounted: Array<() => void> = [];

afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount();
});

describe('DialogContent', () => {
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
        <Dialog open>
          <DialogContent closeButton={{ label: 'Cerrar' }}>
            <DialogTitle>Transferencia</DialogTitle>
            <DialogDescription>Detalles</DialogDescription>
          </DialogContent>
        </Dialog>,
      );
    });

    expect(document.querySelector('[data-slot="dialog-close"]')?.textContent).toBe('Cerrar');
  });
});
