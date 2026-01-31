import { execFile } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execFileAsync = promisify(execFile);

dotenv.config();

const localUrl = process.env.LOCAL_DATABASE_URL;

if (!localUrl) {
  throw new Error('LOCAL_DATABASE_URL is not set');
}

async function run() {
  await execFileAsync('pnpm', ['db:migrate'], {
    env: {
      ...process.env,
      DATABASE_URL: localUrl,
    },
    shell: true,
  });

  await execFileAsync('pnpm', ['db:seed'], {
    env: {
      ...process.env,
      DATABASE_URL: localUrl,
      CI: '1',
    },
    shell: true,
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
