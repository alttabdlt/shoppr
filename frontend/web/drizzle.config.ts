import { config as dotenvConfig } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load root-level env for DB credentials
dotenvConfig({ path: '../../.env.local' });
dotenvConfig({ path: '../../.env' });

export default defineConfig({
  schema: '../../backend/core/src/lib/db/schema.ts',
  out: '../../backend/core/src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint: Forbidden non-null assertion.
    url: process.env.POSTGRES_URL!,
  },
});
