import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';
import { prismaClientIsCurrent } from './prisma-client.mjs';

// npm executes workspace scripts from server/, while configuration lives at the root.
config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const conditional = args.includes('--if-needed'), checkOnly = args.includes('--check-only');
const forwarded = args.filter((value) => value !== '--if-needed' && value !== '--check-only');
const cwd = fileURLToPath(new URL('..', import.meta.url));
try {
  let generate = true;
  if (conditional || checkOnly) {
    if (forwarded.length !== 1 || forwarded[0] !== 'generate' || conditional && checkOnly) throw new Error('Use conditional generation only with the default schema.');
    const version = require('prisma/package.json').version;
    if (require('@prisma/client/package.json').version !== version) throw new Error('Install matching Prisma CLI and client versions before generating.');
    const current = await prismaClientIsCurrent({ schemaPath: resolve(cwd, 'prisma/schema.prisma'),
      clientDirectory: resolve(dirname(require.resolve('@prisma/client/package.json')), '../../.prisma/client'),
      version, prismaCli: require.resolve('prisma'), cwd });
    if (current) { process.stdout.write('Prisma Client is current; skipping generation.\n'); generate = false; }
    else if (checkOnly) throw new Error('Prisma Client is out of date. Stop the GitFolio API/worker and run npm run db:generate.');
  }
  if (generate) {
    const result = spawnSync(process.execPath, [require.resolve('prisma'), ...forwarded], { cwd, env: process.env, stdio: 'inherit' });
    process.exitCode = result.status ?? 1;
    if (process.platform === 'win32' && forwarded[0] === 'generate' && process.exitCode) {
      process.stderr.write('If generation reports EPERM, stop the GitFolio API and publishing worker in their terminals, then retry. Keep Docker running.\n');
    }
  }
} catch (error) {
  // Do not print environment values, raw filesystem diagnostics, or stacks.
  const message = error.code ? 'Prisma Client could not be checked. Stop the GitFolio API/worker and retry generation.' : error.message;
  process.stderr.write(`${message}\n`); process.exitCode = 1;
}
