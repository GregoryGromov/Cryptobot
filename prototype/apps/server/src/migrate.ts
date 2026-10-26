import { parseConfig } from './platform/config.js';
import { migrateDatabase } from './platform/migrate.js';

const config = parseConfig(process.env);
await migrateDatabase(config.MIGRATION_DATABASE_URL ?? config.DATABASE_URL);
console.info('Application and pg-boss migrations applied');
