import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const root = new URL('../client/dist/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('.vite/manifest.json', root), 'utf8'));
function dependencies(key, visited = new Set()) {
  if (visited.has(key)) return visited;
  assert.ok(manifest[key], `Missing manifest entry: ${key}`);
  visited.add(key);
  for (const child of manifest[key].imports ?? []) dependencies(child, visited);
  return visited;
}
async function gzipSize(keys) {
  let bytes = 0;
  for (const key of keys) {
    const content = await readFile(new URL(manifest[key].file, root));
    assert.ok(!content.includes('reactjs.org/link/refs-must-have-owner'), 'React development code entered the production bundle');
    bytes += gzipSync(content).length;
  }
  return bytes;
}
const entry = dependencies('index.html'), login = dependencies('src/pages/LoginPage.tsx');
for (const key of login) assert.ok(!/TemplateArtwork|DesignedPortfolio|EditorPage/.test(key), 'Portfolio rendering must remain deferred on sign-in');
const lazyRoutes = ['Login', 'OAuthCallback', 'Account', 'Dashboard', 'NewProject', 'Editor', 'Deployments', 'Templates', 'TemplateDetail'];
for (const name of lazyRoutes) {
  assert.equal(manifest[`src/pages/${name}Page.tsx`]?.isDynamicEntry, true, `${name} must remain a lazy route`);
}
const entryGzip = await gzipSize(entry), loginGzip = await gzipSize(login);
assert.ok(entryGzip <= 120 * 1024, `Entry JavaScript exceeds 120 KiB gzip: ${entryGzip}`);
assert.ok(loginGzip <= 135 * 1024, `Sign-in JavaScript exceeds 135 KiB gzip: ${loginGzip}`);
let brandBytes = 0;
for (const name of ['brand-mark.jpg', 'brand-wordmark.jpg']) brandBytes += (await readFile(new URL(`../src/assets/${name}`, root))).length;
assert.ok(brandBytes <= 25000, 'Brand images exceed the 25 kB combined budget');
console.log(JSON.stringify({ entryGzipBytes: entryGzip, signInGzipBytes: loginGzip, brandBytes, lazyRoutes: lazyRoutes.length }, null, 2));
