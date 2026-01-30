import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
    ssl: process.env.POSTGRES_URL?.includes('localhost') || process.env.POSTGRES_URL?.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
  },
} satisfies Config;
