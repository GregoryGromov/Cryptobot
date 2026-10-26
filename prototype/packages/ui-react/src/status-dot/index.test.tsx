import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StatusDot } from './index.js';

describe('StatusDot', () => {
  it('announces the consumer label', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(<StatusDot state="done" label="Terminé" />);

    expect(host.firstElementChild?.getAttribute('aria-label')).toBe('Terminé');
  });
});
