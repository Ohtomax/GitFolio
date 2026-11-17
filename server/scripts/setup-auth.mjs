import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const path = fileURLToPath(new URL('../../.env', import.meta.url));
let contents = readFileSync(existsSync(path) ? path : new URL('../../.env.example', import.meta.url), 'utf8');
const current = parse(contents);
const added = [];
for (const [name, bytes] of [['JWT_SECRET', 48], ['ENCRYPTION_KEY', 32]]) {
  if (current[name]) continue;
  const line = `${name}=${randomBytes(bytes).toString('hex')}`;
  const pattern = new RegExp(`^${name}=.*$`, 'm');
  contents = pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
  added.push(name);
}
if (added.length || !existsSync(path)) writeFileSync(path, contents, { mode: 0o600 });
process.stdout.write(added.length ? `Generated local ${added.join(' and ')} in the ignored root .env.\n` : 'Existing local auth secrets preserved.\n');
process.stdout.write('GitHub app registration and credentials must be supplied separately. No secret values were printed.\n');
