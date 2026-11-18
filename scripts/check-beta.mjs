import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const npm = process.env.npm_execpath;
const reportPath = join(root, '.local/beta/latest.json');
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
const report = { startedAt: new Date().toISOString(), gitHeadAtCheck: head.status === 0 ? head.stdout.trim() : null,
  workingTreeDirty: status.status === 0 ? Boolean(status.stdout.trim()) : null, node: process.version,
  disposableServices: { database: Boolean(process.env.GITFOLIO_TEST_DATABASE_URL), redis: Boolean(process.env.GITFOLIO_TEST_REDIS_URL),
    runtimeDatabase: Boolean(process.env.GITFOLIO_TEST_RUNTIME_DATABASE_URL), templateDatabase: Boolean(process.env.GITFOLIO_TEST_TEMPLATE_DATABASE_URL) },
  steps: [], result: 'incomplete', publicBeta: 'not-launched' };
let running, preview;
const cancel = () => { running?.kill('SIGTERM'); preview?.kill('SIGTERM'); process.exitCode = 1; };
process.once('SIGINT', cancel); process.once('SIGTERM', cancel);
async function run(name, args, environment = {}) {
  if (process.exitCode) throw new Error('Acceptance check interrupted');
  console.log(`\nChecking ${name}…`);
  const started = Date.now();
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, ...environment }, stdio: ['ignore', 'pipe', 'pipe'] });
  running = child;
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => { process.stdout.write(chunk); output = (output + chunk.toString()).slice(-2000000); });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  running = undefined;
  const totals = Object.fromEntries([...output.matchAll(/^# (tests|pass|fail|skipped) (\d+)$/gm)].map((match) => [match[1], Number(match[2])]));
  report.steps.push({ name, passed: code === 0, elapsedMs: Date.now() - started, ...(Object.keys(totals).length ? { totals } : {}) });
  if (code !== 0) throw new Error(`${name} failed; inspect its output above`);
}
try {
  if (!npm) throw new Error('Run this command through npm run beta:check');
  const generated = join(root, 'node_modules/.prisma/client/schema.prisma');
  await readFile(generated).catch(() => { throw new Error('Run npm run db:generate before beta acceptance'); });
  const serverRequire = createRequire(join(root, 'server/package.json'));
  // Prisma's diff accepts its formatter's reordered attributes. It requires no
  // database connection and avoids replacing a DLL held by a running local API.
  await run('generated Prisma schema (regenerate client if stale)', [serverRequire.resolve('prisma'), 'migrate', 'diff',
    '--from-schema-datamodel', generated, '--to-schema-datamodel', join(root, 'server/prisma/schema.prisma'), '--exit-code'],
    { DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/fixture' });
  const clientRequire = createRequire(join(root, 'client/package.json'));
  const playwright = process.env.GITFOLIO_PLAYWRIGHT_MODULE || clientRequire.resolve('playwright');
  const vite = join(dirname(clientRequire.resolve('vite/package.json')), 'bin/vite.js');
  for (const workspace of ['shared', 'server', 'client']) await run(`${workspace} build`, [npm, 'run', 'build', `--workspace=@gitfolio/${workspace}`]);
  await run('workspace types', [npm, 'run', 'typecheck', '--workspaces', '--if-present']);
  const serverTests = (await readdir(join(root, 'server/test'))).filter((name) => name.endsWith('.test.mjs')).map((name) => `server/test/${name}`);
  await run('server tests', ['--test', '--test-reporter=tap', ...serverTests]);
  const clientTests = (await readdir(join(root, 'client/test'))).filter((name) => name.endsWith('.test.ts')).map((name) => `client/test/${name}`);
  await run('client tests', ['--experimental-strip-types', '--test', '--test-reporter=tap', ...clientTests]);
  await run('bundle budgets', ['scripts/check-client-bundle.mjs']);
  preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1', '--port', '0', '--strictPort'], {
    cwd: join(root, 'client'), env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Acceptance preview did not start')), 20000);
    const ready = (url) => { clearTimeout(timer); resolve(url); };
    preview.stdout.on('data', (chunk) => { const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+\//); if (match) ready(match[0]); });
    preview.once('error', (error) => { clearTimeout(timer); reject(error); });
    preview.once('exit', () => { clearTimeout(timer); reject(new Error('Acceptance preview stopped unexpectedly')); });
    // Never print configuration or upstream responses from the preview process.
    preview.stderr.resume();
  });
  const browserTests = (await readdir(join(root, 'client/test/browser'))).filter((name) => name.endsWith('.test.mjs')).map((name) => `client/test/browser/${name}`);
  await run('production browser workflows', ['--test', '--test-reporter=tap', '--test-concurrency=2', ...browserTests], {
    GITFOLIO_BROWSER_BASE_URL: base, GITFOLIO_PLAYWRIGHT_MODULE: playwright,
  });
  const skipped = report.steps.reduce((count, step) => count + (step.totals?.skipped ?? 0), 0);
  report.result = skipped ? 'passed-with-skips' : 'passed';
  console.log(skipped ? `\nChecks passed with ${skipped} skipped tests. Configure disposable service URLs for complete beta acceptance.`
    : '\nLocal beta acceptance passed. Public deployment and live OAuth/Pages verification are separate checks.');
} catch (error) {
  report.result = 'failed'; process.exitCode = 1;
  console.error(error instanceof Error && error.code === 'MODULE_NOT_FOUND'
    ? 'Install project dependencies and a Playwright browser before beta acceptance.' : error.message);
} finally {
  if (preview && preview.exitCode === null && preview.signalCode === null) {
    preview.kill('SIGTERM');
    await new Promise((resolve) => { const timer = setTimeout(resolve, 5000); preview.once('exit', () => { clearTimeout(timer); resolve(); }); });
  }
  report.completedAt = new Date().toISOString();
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log('Acceptance report: .local/beta/latest.json (no credentials or service URLs).');
  process.off('SIGINT', cancel); process.off('SIGTERM', cancel);
}
