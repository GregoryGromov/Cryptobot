import { idSchema } from '@reinforce/harness-contract';
import { z } from 'zod';
import { openDatabase } from './platform/db.js';
import { rebuildAccount } from './workflows/rebuild-account.js';

const accountId = idSchema.parse(process.argv[2]);
const database = openDatabase(z.url().parse(process.env.DATABASE_URL), 'reinforce-rebuild');
try {
  await rebuildAccount({ db: database.db }, accountId);
  process.stdout.write('Account projection restored from immutable facts.\n');
} finally {
  await database.close();
}
