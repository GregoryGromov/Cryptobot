import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StepTimeline } from './index.js';

describe('StepTimeline', () => {
  it('announces completed steps with consumer copy', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(
      <StepTimeline
        completedLabel="completado"
        steps={[{ key: 'settled', label: 'Liquidación', status: 'done' }]}
      />,
    );

    expect(host.querySelector('[data-status="done"] .sr-only')?.textContent).toBe(' completado');
  });
});
