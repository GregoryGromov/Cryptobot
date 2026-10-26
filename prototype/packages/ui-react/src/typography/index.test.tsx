import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Heading } from './index.js';

describe('Heading', () => {
  it('keeps the semantic element independent from the visual size', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(
      <Heading as="h3" size="display">
        Settlement status
      </Heading>,
    );

    const heading = host.firstElementChild;

    expect({
      element: heading?.tagName,
      size: heading?.getAttribute('data-size'),
      slot: heading?.getAttribute('data-slot'),
      text: heading?.textContent,
    }).toEqual({
      element: 'H3',
      size: 'display',
      slot: 'heading',
      text: 'Settlement status',
    });
  });
});
