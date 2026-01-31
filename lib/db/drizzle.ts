import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Singleton pattern for the database client to prevent connection leaks during hot-reloads in development.
 */
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

const isLocalConnection = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const sslRequired = !isLocalConnection;

export const client =
  globalForDb.client ??
  postgres(connectionString, {
    prepare: false,
    ssl: sslRequired ? 'require' : false,
    max: process.env.NODE_ENV === 'production' ? undefined : 10,
  });

export const db = globalForDb.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client;
  globalForDb.db = db;
}
