import type { ChartBoxSize } from '@reinforce/ui-primitives/charts';
import { useEffect, useState } from 'react';

const UNMEASURED: ChartBoxSize = { width: 0, height: 0 };

const sameSize = (a: ChartBoxSize, b: ChartBoxSize): boolean => a.width === b.width && a.height === b.height;

export type ChartBoxMeasure<T extends HTMLElement> = {
  readonly ref: (node: T | null) => void;
  readonly size: ChartBoxSize;
};

export type ChartWidthMeasure<T extends HTMLElement> = {
  readonly ref: (node: T | null) => void;
  readonly width: number;
};

export function useChartBoxSize<T extends HTMLElement>(): ChartBoxMeasure<T> {
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState<ChartBoxSize>(UNMEASURED);

  useEffect(() => {
    if (node === null) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = node.getBoundingClientRect();
        const next: ChartBoxSize = { width: rect.width, height: rect.height };
        setSize((prev) => (sameSize(prev, next) ? prev : next));
      });
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [node]);

  return { ref: setNode, size };
}

export function useChartWidth<T extends HTMLElement>(): ChartWidthMeasure<T> {
  const { ref, size } = useChartBoxSize<T>();
  return { ref, width: size.width };
}
