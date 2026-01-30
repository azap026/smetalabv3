import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL or DATABASE_URL environment variable is not set');
}

/**
 * Singleton pattern for the database client to prevent connection leaks during hot-reloads in development.
 */
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export const client =
  globalForDb.client ??
  postgres(connectionString, {
    prepare: false,
    ssl: process.env.CI || connectionString.includes('localhost') ? false : 'require',
    max: process.env.NODE_ENV === 'production' ? undefined : 10,
  });

export const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client;
  globalForDb.db = db;
}
