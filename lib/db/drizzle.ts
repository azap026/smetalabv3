import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Allow build to pass without DB connection
if (!connectionString && process.env.NEXT_PHASE !== 'phase-production-build') {
  // Check if we are running in a build environment where we might not need the DB
  // This is a heuristic - ideally we'd check for a specific build flag
  console.warn('⚠️ POSTGRES_URL is missing. Database connection will fail if used.');
}

/**
 * Singleton pattern for the database client to prevent connection leaks during hot-reloads in development.
 */
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

// Fallback for build time to prevent crash
const safeConnectionString = connectionString || 'postgres://placeholder:placeholder@localhost:5432/placeholder';

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
