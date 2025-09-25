import { config as dotenvConfig } from 'dotenv';
import { resolve as pathResolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load env from root (both .env.local and .env)
dotenvConfig({ path: pathResolve(process.cwd(), '.env.local') });
dotenvConfig({ path: pathResolve(process.cwd(), '.env') });
dotenvConfig({ path: pathResolve(process.cwd(), '../../.env.local') });
dotenvConfig({ path: pathResolve(process.cwd(), '../../.env') });

async function canConnect(url: string): Promise<boolean> {
  try {
    const postgres = (await import('postgres')).default;
    const sql = postgres(url, { max: 1 });
    await sql`select 1 as x`;
    await sql.end({ timeout: 1 });
    return true;
  } catch (_) {
    return false;
  }
}

async function runMigrations() {
  const url = process.env.POSTGRES_URL;

  if (!url) {
    console.warn('[try-migrate] POSTGRES_URL not set. Skipping migrations.');
    return;
  }

  const ok = await canConnect(url);
  if (!ok) {
    console.warn('[try-migrate] Database is not reachable. Skipping migrations.');
    return;
  }

  console.log('[try-migrate] Database reachable. Running migrations...');

  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { migrate } = await import('drizzle-orm/postgres-js/migrator');
  const postgres = (await import('postgres')).default;

  const connection = postgres(url, { max: 1 });
  const db = drizzle(connection);

  const migrationsFolder = pathResolve(
    dirname(fileURLToPath(import.meta.url)),
    './migrations',
  );

  const start = Date.now();
  await migrate(db, { migrationsFolder });
  const end = Date.now();
  console.log(`[try-migrate] ✅ Migrations completed in ${end - start}ms`);
}

runMigrations().catch((err) => {
  console.error('[try-migrate] Migration failed (non-fatal for build):', err?.message || err);
});

