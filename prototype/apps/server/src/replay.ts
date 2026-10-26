import { readFile, stat, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { parseConfig } from './platform/config.js';
import { openDatabase } from './platform/db.js';
import { type Jobs, makeJobs } from './platform/jobs.js';
import { migrateDatabase } from './platform/migrate.js';
import { runScenario } from './replay/run.js';
import { scenarioSchema } from './replay/scenario.js';

const { values } = parseArgs({ options: { scenario: { type: 'string' }, out: { type: 'string' } } });
if (!values.scenario || !values.out)
  throw new Error('Usage: replay:scenario --scenario FILE.json --out REPORT.json');
if ((await stat(values.scenario)).size > 32_000_000) throw new Error('Scenario exceeds 32 MB');
const scenario = scenarioSchema.parse(JSON.parse(await readFile(values.scenario, 'utf8')));
const existing = await stat(values.out).catch((error: NodeJS.ErrnoException) => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (existing) throw new Error('Output file already exists');
// Deliberately ignore DATABASE_URL and all configured external providers.
let container: StartedPostgreSqlContainer | undefined;
let database: ReturnType<typeof openDatabase> | undefined;
let jobs: Jobs | undefined;
try {
  container = await new PostgreSqlContainer('postgres:18-alpine').start();
  const url = container.getConnectionUri();
  await migrateDatabase(url);
  database = openDatabase(url, 'reinforce-workflow-replay');
  const config = parseConfig({
    DATABASE_URL: url,
    NODE_ENV: 'test',
    MARKET_MODE: 'replay',
    MODEL_MODE: 'replay',
  });
  jobs = makeJobs(url);
  jobs.on('error', () => {});
  await jobs.start();
  const report = await runScenario({ db: database.db, jobs, config }, scenario);
  await writeFile(values.out, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  process.stdout.write('Workflow replay report written. Disposable database will be removed.\n');
} finally {
  await jobs?.stop();
  await database?.close();
  await container?.stop();
}
