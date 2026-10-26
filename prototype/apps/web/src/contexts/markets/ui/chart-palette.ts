import { useEffect, useState } from 'react';

export type ChartPalette = {
  readonly up: string;
  readonly down: string;
  readonly upSoft: string;
  readonly downSoft: string;
  readonly line: string;
  readonly text: string;
  readonly grid: string;
  readonly cross: string;
  readonly label: string;
  /** The lines of markets compared with this one, in the order of `PEER_DOT_CLASSES`. */
  readonly peers: readonly string[];
  /** The lines of the indicators, in the colours of `INDICATOR_SWATCH_CLASSES`. */
  readonly vwap: string;
  readonly bands: string;
  readonly rsi: string;
};

const PEER_TOKENS = ['--chart-2', '--chart-4', '--chart-3'] as const;

export const PEER_DOT_CLASSES = ['bg-chart-2', 'bg-chart-4', 'bg-chart-3'] as const;

export const INDICATOR_SWATCH_CLASSES = {
  vwap: 'bg-chart-2',
  bands: 'bg-chart-4',
  volume: 'bg-up',
  rsi: 'bg-chart-1',
} as const;

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

function readPalette(): ChartPalette {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => rgbOf(css.getPropertyValue(name).trim() || 'gray');
  const up = token('--success');
  const down = token('--destructive');
  const foreground = token('--foreground');
  return {
    up: rgba(up, 0.95),
    down: rgba(down, 0.95),
    upSoft: rgba(up, 0.22),
    downSoft: rgba(down, 0.22),
    line: rgba(token('--primary'), 1),
    text: rgba(token('--muted-foreground'), 1),
    grid: rgba(foreground, 0.04),
    cross: rgba(foreground, 0.25),
    label: rgba(token('--background'), 1),
    peers: PEER_TOKENS.map((name) => rgba(token(name), 1)),
    vwap: rgba(token('--chart-2'), 1),
    bands: rgba(token('--chart-4'), 0.75),
    rsi: rgba(token('--chart-1'), 1),
  };
}

export function useChartPalette(): ChartPalette {
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
