import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const serverDir = join(root, 'server');

const enableWorker = process.env.ENABLE_WORKER !== 'false';
const procs = [];
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('[Runner] Received termination signal. Initiating graceful shutdown...');

  for (const { name, proc } of procs) {
    if (!proc.killed) {
      console.log(`[Runner] Stopping ${name} (PID: ${proc.pid})...`);
      proc.kill('SIGTERM');
    }
  }

  // Safety net: force exit if child processes fail to terminate within 10s
  const forceKillTimeout = setTimeout(() => {
    console.error('[Runner] Graceful shutdown deadline exceeded; forcing exit.');
    for (const { proc } of procs) {
      if (!proc.killed) proc.kill('SIGKILL');
    }
    process.exit(Math.max(exitCode, 1));
  }, 10000);

  forceKillTimeout.unref();
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

function startProcess(name, scriptPath) {
  console.log(`[Runner] Spawning ${name}: node ${scriptPath}`);
  const proc = spawn(process.execPath, [scriptPath], {
    cwd: serverDir,
    env: process.env,
    stdio: 'inherit',
  });

  procs.push({ name, proc });

  proc.on('exit', (code, signal) => {
    console.log(`[Runner] ${name} exited with code ${code ?? signal}`);
    if (!shuttingDown) {
      if (name === 'GitFolio API' && (code !== 0 || signal)) {
        console.error('[Runner] GitFolio API exited unexpectedly. Triggering shutdown.');
        shutdown(code ?? 1);
      }
    }
  });

  proc.on('error', (err) => {
    console.error(`[Runner] Failed to spawn ${name}:`, err);
    if (!shuttingDown) shutdown(1);
  });

  return proc;
}

// 1. Start GitFolio HTTP API Server
startProcess('GitFolio API', join(serverDir, 'dist/index.js'));

// 2. Start GitFolio Deployment Worker (BullMQ background processor for GitHub publishing)
if (enableWorker) {
  startProcess('GitFolio Worker', join(serverDir, 'dist/worker.js'));
} else {
  console.log('[Runner] Background deployment worker is disabled (ENABLE_WORKER=false).');
}
