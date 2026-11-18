import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, unlink, readdir, readFile, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { prismaClientIsCurrent } from '../scripts/prisma-client.mjs';

const require = createRequire(import.meta.url), prismaCli = require.resolve('prisma');
const version = require('prisma/package.json').version;
const schema = (field = 'name String', generator = '') => `generator client {
 provider = "prisma-client-js"
 ${generator}
}
datasource db {
 provider = "postgresql"
 url = env("DATABASE_URL")
}
model Example {
 id Int @id
 ${field}
}
`;
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'gitfolio-prisma-test-')), clientDirectory = join(root, 'client');
  await mkdir(clientDirectory);
  const engine = process.platform === 'win32' ? 'query_engine-windows.dll.node' : process.platform === 'darwin' ? 'libquery_engine-darwin.dylib.node' : 'libquery_engine-debian-openssl-3.0.x.so.node';
  const options = { schemaPath: join(root, 'schema.prisma'), clientDirectory, version, prismaCli, cwd: fileURLToPath(new URL('..', import.meta.url)),
    environment: { ...process.env, DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/fixture' } };
  await Promise.all([writeFile(options.schemaPath, schema()), writeFile(join(clientDirectory, 'schema.prisma'), schema()),
    writeFile(join(clientDirectory, 'package.json'), JSON.stringify({ version })), writeFile(join(clientDirectory, 'index.js'), ''),
    writeFile(join(clientDirectory, 'index.d.ts'), ''), writeFile(join(clientDirectory, engine), '')]);
  t.after(async () => {
    for (const name of await readdir(clientDirectory)) await unlink(join(clientDirectory, name));
    await rmdir(clientDirectory); await unlink(options.schemaPath); await rmdir(root);
  });
  return { options, engine };
}

test('an equivalent formatted Prisma client is reused without modifying the schema or engine', async (t) => {
  const { options, engine } = await fixture(t);
  const source = schema().replace('id Int @id', 'id     Int    @id');
  await writeFile(options.schemaPath, source);
  assert.equal(await prismaClientIsCurrent(options), true);
  assert.equal(await readFile(options.schemaPath, 'utf8'), source);
  assert.equal(await readFile(join(options.clientDirectory, engine), 'utf8'), '');
});

test('client field renames using @map are detected even when the database structure is unchanged', async (t) => {
  const { options } = await fixture(t);
  await writeFile(options.schemaPath, schema('label String @map("name")'));
  const diff = spawnSync(process.execPath, [prismaCli, 'migrate', 'diff', '--from-schema-datamodel', join(options.clientDirectory, 'schema.prisma'),
    '--to-schema-datamodel', options.schemaPath, '--exit-code'], { cwd: options.cwd, env: options.environment, encoding: 'utf8' });
  assert.equal(diff.status, 0, 'this rename has no SQL migration');
  assert.equal(await prismaClientIsCurrent(options), false, 'the generated client still needs the renamed API field');
});

test('generator changes, package upgrades, and missing runtime artifacts require generation', async (t) => {
  const { options, engine } = await fixture(t);
  await writeFile(options.schemaPath, schema('name String', 'previewFeatures = ["fullTextSearch"]'));
  assert.equal(await prismaClientIsCurrent(options), false);
  await writeFile(options.schemaPath, schema());
  await writeFile(join(options.clientDirectory, 'package.json'), JSON.stringify({ version: '0.0.0' }));
  assert.equal(await prismaClientIsCurrent(options), false);
  await writeFile(join(options.clientDirectory, 'package.json'), JSON.stringify({ version }));
  await unlink(join(options.clientDirectory, engine));
  assert.equal(await prismaClientIsCurrent(options), false);
});

test('invalid schemas fail the readiness check without printing schema values', async (t) => {
  const { options } = await fixture(t);
  await writeFile(options.schemaPath, schema('private_fixture_marker UnknownFieldType'));
  await assert.rejects(prismaClientIsCurrent(options), (error) => {
    assert.match(error.message, /Could not compare Prisma schemas/);
    assert.doesNotMatch(error.message, /private_fixture_marker|UnknownFieldType|postgresql/); return true;
  });
});
