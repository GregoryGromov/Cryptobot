import type { WhyPoint } from '@reinforce/server/dto';
import type { Stance } from './episode-vm';

export type PointStance = WhyPoint['stance'];

const STANCES = ['up', 'down', 'flat', 'risk'] as const;

export type OrderedPoint = { readonly index: number; readonly point: WhyPoint };

export const orderedPoints = (points: readonly WhyPoint[], main: Stance | null): readonly OrderedPoint[] => {
  const order = main === null ? STANCES : [main, ...STANCES.filter((s) => s !== main)];
  return order.flatMap((stance) =>
    points.flatMap((point, index) => (point.stance === stance ? [{ index, point }] : [])),
  );
};

export const pointKey = (forecastId: string, index: number): string => `why-${forecastId}-${index}`;
