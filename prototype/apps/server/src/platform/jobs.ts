import { sql } from 'drizzle-orm';
import { fromDrizzle, PgBoss } from 'pg-boss';
import { z } from 'zod';
import type { Tx } from './db.js';

export const JOB_NAMES = [
  'market.dispatch',
  'forecast.run',
  'conversation.respond',
  'trade.execute',
  'broker.advance',
  'forecast.resolve',
  'position.settle',
  'notification.send',
  'analytics.send',
] as const;
export type JobName = (typeof JOB_NAMES)[number];
export const jobPayloadSchema = z.strictObject({ v: z.literal(1), id: z.string().min(1).max(200) });
export type JobPayload = z.infer<typeof jobPayloadSchema>;

export function makeJobs(connectionString: string, migrate = false) {
  return new PgBoss({
    connectionString,
    schema: 'pgboss',
    migrate,
    max: 5,
    application_name: 'reinforce-jobs',
    monitorIntervalSeconds: 30,
  });
}
export type Jobs = ReturnType<typeof makeJobs>;

/** How many times a failed job is run again before its failure stands. */
export const RETRY_LIMIT = 3;

export async function prepareQueues(boss: Jobs): Promise<void> {
  for (const name of JOB_NAMES) {
    await boss.createQueue(name, {
      retryLimit: name === 'analytics.send' ? 8 : RETRY_LIMIT,
      retryDelay: 2,
      retryBackoff: true,
      expireInSeconds: 240,
      retentionSeconds: 7 * 86400,
      deleteAfterSeconds: 7 * 86400,
    });
  }
}

export async function enqueue(
  boss: Jobs,
  tx: Tx,
  name: JobName,
  id: string,
  after?: number,
): Promise<string | null> {
  return boss.send(name, { v: 1, id } satisfies JobPayload, {
    db: fromDrizzle(tx, sql),
    ...(after === undefined ? {} : { startAfter: new Date(after) }),
  });
}
