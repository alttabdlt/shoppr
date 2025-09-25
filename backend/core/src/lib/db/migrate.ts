import { config as dotenvConfig } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Attempt to load env from root or current working directory
import { resolve as pathResolve } from 'node:path';
dotenvConfig({ path: pathResolve(process.cwd(), '.env.local') });
dotenvConfig({ path: pathResolve(process.cwd(), '.env') });
dotenvConfig({ path: pathResolve(process.cwd(), '../../.env.local') });
dotenvConfig({ path: pathResolve(process.cwd(), '../../.env') });

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);
  const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), './migrations');

  console.log('⏳ Running migrations...');

  const start = Date.now();
  await migrate(db, { migrationsFolder });
  const end = Date.now();

  console.log('✅ Migrations completed in', end - start, 'ms');
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
