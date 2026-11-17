import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import pino from 'pino';
import { DeploymentJobSchema, createDeploymentQueue, deploymentConnection, registerDeploymentWorker } from '../dist/queues/deployment.queue.js';

test('queue connections separate producer failures from worker retries and restrict job payloads to an ID', () => {
  const producer = deploymentConnection('rediss://fixture:password@localhost:6380/2', false);
  assert.equal(producer.maxRetriesPerRequest, 1); assert.equal(producer.enableOfflineQueue, false);
  assert.equal(producer.db, 2); assert.ok(producer.tls);
  assert.ok(producer.retryStrategy(2) > 0);
  assert.equal(deploymentConnection('redis://localhost', true).maxRetriesPerRequest, null);
  assert.throws(() => deploymentConnection('https://localhost', false));
  assert.throws(() => deploymentConnection('redis://localhost/invalid', false));
  assert.equal(DeploymentJobSchema.safeParse({ deploymentId: randomUUID(), token: 'never-in-redis' }).success, false);
});

test('real BullMQ worker consumes an ID, delays verification, deduplicates jobs, and releases connections', {
  skip: process.env.GITFOLIO_TEST_REDIS_URL ? false : 'Set a disposable GITFOLIO_TEST_REDIS_URL', timeout: 20000,
}, async () => {
  const prefix = `gitfolio_test_${randomUUID()}`, id = randomUUID(), logger = pino({ level: 'silent' });
  const producer = createDeploymentQueue(process.env.GITFOLIO_TEST_REDIS_URL, logger, prefix);
  let calls = 0;
  const worker = registerDeploymentWorker(process.env.GITFOLIO_TEST_REDIS_URL, logger, async (deploymentId) => {
    assert.equal(deploymentId, id); calls++; return calls === 1 ? { retryAfterMs: 1000 } : undefined;
  }, prefix);
  try {
    await Promise.all([worker.waitUntilReady(), producer.queue.waitUntilReady()]);
    await Promise.all([producer.enqueue(id), producer.enqueue(id)]);
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const job = await producer.queue.getJob(id);
      if (await job?.getState() === 'completed') break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(calls, 2); assert.equal(await (await producer.queue.getJob(id)).getState(), 'completed');
  } finally { await worker.close(); await producer.queue.obliterate({ force: true }); await producer.close(); }
});
