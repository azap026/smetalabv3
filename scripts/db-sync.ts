import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type SyncDirection = 'push' | 'pull';

type ParsedDatabaseUrl = {
  url: string;
  user: string;
  db: string;
};

const CONTAINER_NAME = 'smetalab-db';
const CONTAINER_DUMP_PATH = '/tmp/db.dump';
const IMAGE_NAME = 'postgres:17-alpine';

import dotenv from 'dotenv';

dotenv.config();

const rawLocalUrl = process.env.LOCAL_DATABASE_URL;
const rawRemoteUrl = process.env.REMOTE_DATABASE_URL;

if (!rawLocalUrl || !rawRemoteUrl) {
  throw new Error('LOCAL_DATABASE_URL and REMOTE_DATABASE_URL must be set');
}

const TMP_DIR = path.join(process.cwd(), '.tmp');
const DUMP_PATH = path.join(TMP_DIR, 'db.dump');

function normalizeDatabaseUrl(value: string): string {
  let normalized = value.trim();

  for (let i = 0; i < 2; i += 1) {
    if (normalized.startsWith('psql ')) {
      normalized = normalized.replace(/^psql\s+/, '');
    }

    if (
      (normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))
    ) {
      normalized = normalized.slice(1, -1);
    }
  }

  return normalized;
}

function parseDatabaseUrl(value: string): ParsedDatabaseUrl {
  const normalized = normalizeDatabaseUrl(value);
  const url = new URL(normalized);
  const db = url.pathname.replace('/', '') || 'postgres';
  const user = url.username || 'postgres';

  return { url: normalized, user, db };
}

const LOCAL_DATABASE = parseDatabaseUrl(rawLocalUrl);
const REMOTE_DATABASE = parseDatabaseUrl(rawRemoteUrl);

function getDockerVolumePath(dirPath: string): string {
  return path.resolve(dirPath).replace(/\\/g, '/');
}

async function ensureTmpDir() {
  await fs.mkdir(TMP_DIR, { recursive: true });
}

async function runDockerCommand(args: string[]) {
  await execFileAsync('docker', args, {
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function dumpLocalDatabase() {
  await runDockerCommand([
    'exec',
    CONTAINER_NAME,
    'pg_dump',
    '--no-owner',
    '--no-acl',
    '--format=custom',
    '-U',
    LOCAL_DATABASE.user,
    '-d',
    LOCAL_DATABASE.db,
    '-f',
    CONTAINER_DUMP_PATH,
  ]);

  await runDockerCommand([
    'cp',
    `${CONTAINER_NAME}:${CONTAINER_DUMP_PATH}`,
    DUMP_PATH,
  ]);
}

async function restoreLocalDatabase() {
  await runDockerCommand(['cp', DUMP_PATH, `${CONTAINER_NAME}:${CONTAINER_DUMP_PATH}`]);

  await runDockerCommand([
    'exec',
    CONTAINER_NAME,
    'pg_restore',
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-acl',
    '-U',
    LOCAL_DATABASE.user,
    '-d',
    LOCAL_DATABASE.db,
    CONTAINER_DUMP_PATH,
  ]);
}

async function dumpRemoteDatabase() {
  const dockerPath = getDockerVolumePath(TMP_DIR);

  await runDockerCommand([
    'run',
    '--rm',
    '-v',
    `${dockerPath}:/tmp`,
    IMAGE_NAME,
    'pg_dump',
    '--no-owner',
    '--no-acl',
    '--format=custom',
    REMOTE_DATABASE.url,
    '-f',
    '/tmp/db.dump',
  ]);
}

async function restoreRemoteDatabase() {
  const dockerPath = getDockerVolumePath(TMP_DIR);

  await runDockerCommand([
    'run',
    '--rm',
    '-v',
    `${dockerPath}:/tmp`,
    IMAGE_NAME,
    'pg_restore',
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-acl',
    '-d',
    REMOTE_DATABASE.url,
    '/tmp/db.dump',
  ]);
}

async function run(direction: SyncDirection) {
  await ensureTmpDir();

  if (direction === 'push') {
    await dumpLocalDatabase();
    await restoreRemoteDatabase();
    return;
  }

  await dumpRemoteDatabase();
  await restoreLocalDatabase();
}

const direction = process.argv[2] as SyncDirection | undefined;

if (direction !== 'push' && direction !== 'pull') {
  throw new Error('Usage: tsx scripts/db-sync.ts <push|pull>');
}

run(direction).catch((error) => {
  console.error(error);
  process.exit(1);
});
