import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// npm executes workspace scripts from server/, while configuration lives at the root.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve('prisma'), ...process.argv.slice(2)], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: process.env,
  stdio: 'inherit',
});

process.exitCode = result.status ?? 1;
