import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { makeJobs, prepareQueues } from './jobs.js';

const directory = new URL('../../migrations/', import.meta.url);
const runtimeRole = new URL('./runtime-role.sql', import.meta.url);
export async function migrateDatabase(url: string): Promise<void> {
  const client = new pg.Client({ connectionString: url, application_name: 'reinforce-migrate' });
  await client.connect();
  try {
    await client.query("select pg_advisory_lock(hashtext('reinforce-migrations'))");
    await client.query(
      'create table if not exists public.schema_migrations (name text primary key, hash text not null, applied_at timestamptz not null default clock_timestamp())',
    );
    for (const name of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
      const content = await readFile(`${fileURLToPath(directory)}${name}`, 'utf8');
      const hash = createHash('sha256').update(content).digest('hex');
      const existing = await client.query<{ hash: string }>(
        'select hash from public.schema_migrations where name = $1',
        [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].hash !== hash) throw new Error(`Applied migration was modified: ${name}`);
        continue;
      }
      await client.query('begin');
      try {
        await client.query(content);
        await client.query('insert into public.schema_migrations(name, hash) values ($1, $2)', [name, hash]);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
    const jobs = makeJobs(url, true);
    jobs.on('error', () => {}); // start/stop still reject; bootstrap has no background work.
    try {
      await jobs.start();
      await prepareQueues(jobs);
    } finally {
      await jobs.stop();
    }
    await client.query(await readFile(runtimeRole, 'utf8'));
  } finally {
    await client.query("select pg_advisory_unlock(hashtext('reinforce-migrations'))").catch(() => undefined);
    await client.end();
  }
}
