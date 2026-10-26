import { useEffect, useState } from 'react';

export type SignalPalette = {
  readonly up: string;
  readonly down: string;
  readonly upSoft: string;
  readonly downSoft: string;
  readonly upLine: string;
  readonly downLine: string;
  readonly entry: string;
  readonly entryLine: string;
  readonly onEntry: string;
  readonly range: string;
  readonly rangeFade: string;
  readonly rangeEdge: string;
  readonly rangeMid: string;
  readonly text: string;
  readonly grid: string;
  readonly cross: string;
  readonly label: string;
};

type Rgb = readonly [number, number, number];

// The canvas cannot read CSS variables or oklch on every engine, so a token is painted once and read back.
function rgbOf(color: string): Rgb {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [128, 128, 128];
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 128, g = 128, b = 128] = context.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const rgba = ([r, g, b]: Rgb, alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

function readPalette(): SignalPalette {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => rgbOf(css.getPropertyValue(name).trim() || 'gray');
  const up = token('--success');
  const down = token('--destructive');
  const primary = token('--primary');
  const range = token('--chart-1');
  const foreground = token('--foreground');
  return {
    up: rgba(up, 0.95),
    down: rgba(down, 0.95),
    upSoft: rgba(up, 0.16),
    downSoft: rgba(down, 0.16),
    upLine: rgba(up, 0.7),
    downLine: rgba(down, 0.7),
    entry: rgba(primary, 1),
    entryLine: rgba(primary, 0.85),
    onEntry: rgba(token('--primary-foreground'), 1),
    range: rgba(range, 0.26),
    rangeFade: rgba(range, 0.05),
    rangeEdge: rgba(range, 0.45),
    rangeMid: rgba(range, 0.95),
    text: rgba(token('--muted-foreground'), 1),
    grid: rgba(foreground, 0.045),
    cross: rgba(foreground, 0.3),
    label: rgba(token('--background'), 1),
  };
}

export function useSignalPalette(): SignalPalette {
  const [palette, setPalette] = useState(readPalette);
  useEffect(() => {
    const refresh = () => setPalette(readPalette());
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', refresh);
    return () => {
      observer.disconnect();
      scheme.removeEventListener('change', refresh);
    };
  }, []);
  return palette;
}
