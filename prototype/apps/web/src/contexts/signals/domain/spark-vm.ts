import type { SignalView } from '@reinforce/server/dto';
import { type SparkFrame, sparkAreaPath, sparkPath } from '@reinforce/ui-primitives/charts';

type Spark = NonNullable<SignalView['spark']>;

export type SparkSeries = { readonly values: readonly (number | null)[]; readonly at: number };

const gap = (length: number): null[] => Array.from({ length }, () => null);

export const sparkSeries = (spark: Spark): SparkSeries => {
  const lead = Math.max(0, spark.before - 1 - spark.at);
  const shifted = [...gap(lead), ...spark.values];
  const total = Math.max(shifted.length, spark.before + spark.after);
  return { values: [...shifted, ...gap(total - shifted.length)], at: spark.at + lead };
};

export const sparkGeometry = (spark: Spark, frame: SparkFrame) => {
  const { values, at } = sparkSeries(spark);
  const span = Math.max(values.length - 1, 1);
  return {
    line: sparkPath(values, frame),
    area: sparkAreaPath(values, frame),
    eventX: frame.pad + (at / span) * (frame.width - 2 * frame.pad),
  };
};
