import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from './index.js';

const render = (node: ReactNode) => {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(node);
  const button = host.querySelector('button');
  if (!button) throw new Error('no button rendered');
  return button;
};

describe('Button', () => {
  it('keeps a loading label out of sight under the spinner', () => {
    const button = render(<Button loading>Confirming</Button>);
    const visible = [...button.childNodes].filter(
      (node) => !(node instanceof Element && node.getAttribute('data-slot') === 'button-spinner'),
    );

    expect(visible.every((node) => node instanceof Element)).toBe(true);
    expect(button.textContent).toBe('Confirming');
  });

  it('leaves an idle label as the button’s own text', () => {
    const button = render(<Button>Invite a friend</Button>);

    expect(button.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  });

  it('stays busy rather than faded while loading', () => {
    const button = render(<Button loading>Confirming</Button>);

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
  });
});
