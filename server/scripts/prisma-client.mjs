import { spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function prismaClientIsCurrent({ schemaPath, clientDirectory, version, prismaCli, cwd, environment = process.env }) {
  let generatedSchema;
  try {
    const metadata = JSON.parse(await readFile(join(clientDirectory, 'package.json'), 'utf8'));
    if (metadata.version !== version) return false;
    await Promise.all(['index.js', 'index.d.ts'].map((file) => access(join(clientDirectory, file))));
    const files = await readdir(clientDirectory);
    const hasEngine = files.some((file) => process.platform === 'win32' ? file === 'query_engine-windows.dll.node'
      : process.platform === 'darwin' ? /^libquery_engine-darwin.*\.dylib\.node$/.test(file) : /^libquery_engine-.*\.so\.node$/.test(file));
    if (!hasEngine) return false;
    generatedSchema = await readFile(join(clientDirectory, 'schema.prisma'), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return false;
    throw error;
  }
  const source = await readFile(schemaPath, 'utf8');
  const directory = await mkdtemp(join(tmpdir(), 'gitfolio-prisma-check-'));
  const paths = [join(directory, 'source.prisma'), join(directory, 'generated.prisma')];
  try {
    await Promise.all(paths.map((path, index) => writeFile(path, index === 0 ? source : generatedSchema)));
    for (const path of paths) {
      const result = spawnSync(process.execPath, [prismaCli, 'format', '--schema', path], {
        cwd, env: environment, encoding: 'utf8', timeout: 30000, windowsHide: true,
      });
      if (result.status !== 0) throw new Error('Could not compare Prisma schemas. Stop the GitFolio API/worker and run npm run db:generate.');
    }
    // Compare the entire formatted schema, including client field names and
    // generator options. A database-only diff misses renames using @map.
    const normalized = await Promise.all(paths.map(async (path) => (await readFile(path, 'utf8')).replace(/\r\n/g, '\n')));
    return normalized[0] === normalized[1];
  } finally {
    // These are the two files we created. Avoid recursive removal of temp paths.
    await Promise.allSettled(paths.map((path) => unlink(path)));
    await rmdir(directory);
  }
}
