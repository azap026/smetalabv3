import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

/**
 * Singleton pattern for the database client to prevent connection leaks during hot-reloads in development.
 */
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

// Fallback to a dummy connection string during build time to prevent crashes
// when environment variables are missing (e.g. in Docker builds).
const safeConnectionString = connectionString || 'postgres://dummy:dummy@localhost:5432/dummy';

export const client =
  globalForDb.client ??
  postgres(safeConnectionString, {
    prepare: false,
    ssl: process.env.CI || safeConnectionString.includes('localhost') ? false : 'require',
    max: process.env.NODE_ENV === 'production' ? undefined : 10,
  });

export const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client;
  globalForDb.db = db;
}
