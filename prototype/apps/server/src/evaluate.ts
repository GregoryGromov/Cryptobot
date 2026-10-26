import { readFile, stat, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { openRouter } from './adapters/model.js';
import { replayModel } from './adapters/replay-model.js';
import * as forecast from './modules/forecast/index.js';
import { systemClock } from './platform/clock.js';
import { parseConfig } from './platform/config.js';
import { openDatabase } from './platform/db.js';
import { evaluateBroker } from './workflows/evaluate-broker.js';
import { exportFixture } from './workflows/export-fixture.js';

const { values } = parseArgs({
  options: {
    export: { type: 'string', multiple: true },
    fixture: { type: 'string' },
    candidate: { type: 'string' },
    broker: { type: 'string' },
    experiment: { type: 'string' },
    out: { type: 'string' },
    mode: { type: 'string', default: 'synthetic' },
  },
});
if (!values.out) throw new Error('An output file is required (--out); existing files are never overwritten');
const existing = await stat(values.out).catch((error: NodeJS.ErrnoException) => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (existing) throw new Error('Output file already exists');
async function jsonFile(path: string | undefined) {
  if (!path) throw new Error('Both --fixture and --candidate are required');
  if ((await stat(path)).size > 32_000_000) throw new Error('Input file exceeds 32 MB');
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}
const database = openDatabase(z.url().parse(process.env.DATABASE_URL), 'reinforce-evaluate');
try {
  let result: unknown;
  if (values.export?.length) {
    if (values.fixture || values.candidate || values.experiment || values.broker)
      throw new Error('Export and evaluation are separate commands');
    result = await exportFixture(
      { db: database.db, clock: systemClock },
      values.export.map((id) => idSchema.parse(id)),
    );
  } else {
    const input = {
      experimentId: idSchema.parse(values.experiment),
      brokerId: idSchema.parse(values.broker),
      fixture: forecast.fixtureSchema.parse(await jsonFile(values.fixture)),
      candidate: forecast.candidateSchema.parse(await jsonFile(values.candidate)),
      modelMode: z.enum(['synthetic', 'platform']).parse(values.mode),
    };
    const config = parseConfig(process.env);
    const port =
      input.modelMode === 'synthetic'
        ? replayModel
        : openRouter(z.string().min(1).parse(config.OPENROUTER_API_KEY));
    result = await evaluateBroker({ db: database.db, clock: systemClock, config }, port, input);
  }
  await writeFile(values.out, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  process.stdout.write('Evaluation artifact written.\n');
} finally {
  await database.close();
}
