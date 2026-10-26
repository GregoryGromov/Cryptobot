import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import * as forecast from './modules/forecast/index.js';
import { systemClock } from './platform/clock.js';
import { openDatabase } from './platform/db.js';
import { rescoreForecast } from './workflows/rescore-forecast.js';

const { values } = parseArgs({
  options: {
    broker: { type: 'string' },
    forecast: { type: 'string' },
    rules: { type: 'string' },
    prices: { type: 'string', default: 'original' },
  },
});
if ((!values.broker && !values.forecast) || (values.broker && values.forecast) || !values.rules)
  throw new Error(
    'Usage: rescore (--broker UUID | --forecast UUID) --rules FILE.json [--prices original|latest]',
  );
const rules = forecast.scoringRulesSchema.parse(JSON.parse(await readFile(values.rules, 'utf8')));
const prices = z.enum(['original', 'latest']).parse(values.prices);
const brokerId = values.broker ? idSchema.parse(values.broker) : null;
const forecastId = values.forecast ? idSchema.parse(values.forecast) : null;
const database = openDatabase(z.url().parse(process.env.DATABASE_URL), 'reinforce-rescore');
try {
  const ids = forecastId
    ? [forecastId]
    : (await forecast.listBrokerForecasts(database.db, brokerId!)).map((f) => f.id);
  if (!ids.length) throw new Error('No forecasts in the selected scope');
  for (const id of ids) {
    const result = await rescoreForecast(
      { db: database.db, clock: systemClock },
      { forecastId: id, rules, prices },
    );
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }
} finally {
  await database.close();
}
