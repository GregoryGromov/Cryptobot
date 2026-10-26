import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export const openDatabase = (url: string, applicationName = 'reinforce', max = 10) => {
  const pool = new pg.Pool({
    connectionString: url,
    max,
    application_name: applicationName,
    statement_timeout: 15_000,
    idle_in_transaction_session_timeout: 10_000,
    connectionTimeoutMillis: 5000,
  });
  return { db: drizzle(pool), pool, close: () => pool.end() };
};
export type Database = ReturnType<typeof openDatabase>['db'];
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
export type Db = Database | Tx;

/** A screen combining several tables must observe one committed state. No writes or network calls. */
export function inReadSnapshot<T>(db: Database, read: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(read, { isolationLevel: 'repeatable read', accessMode: 'read only' });
}

export async function lock(tx: Tx, namespace: string, id: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${namespace}:${id}`}, 0))`);
}

function sqlState(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('code' in error && typeof error.code === 'string') return error.code;
  return 'cause' in error ? sqlState(error.cause) : undefined;
}

export async function inTransaction<T>(db: Database, work: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        await tx.execute(sql`set local lock_timeout = '2s'`);
        return work(tx);
      });
    } catch (error) {
      if (attempt >= 2 || !['40001', '40P01', '55P03'].includes(sqlState(error) ?? '')) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
}
