import assert from 'node:assert/strict';
import test from 'node:test';
import { generateReactProject } from '../dist/generators/react.generator.js';
import { generatorProject } from './helpers/portfolio.mjs';

test('React output includes locked dependencies, portable Vite paths, and a pinned Pages workflow', () => {
  const files = generateReactProject(generatorProject()), byPath = Object.fromEntries(files.map((file) => [file.path, file.content]));
  const pkg = JSON.parse(byPath['package.json']), lock = JSON.parse(byPath['package-lock.json']);
  assert.deepEqual(pkg.dependencies, lock.packages[''].dependencies);
  assert.deepEqual(pkg.devDependencies, lock.packages[''].devDependencies);
  assert.match(byPath['vite.config.js'], /base:'\.\/'/);
  assert.match(byPath['.github/workflows/pages.yml'], /npm ci/);
  assert.match(byPath['.github/workflows/pages.yml'], /pages: write/);
  assert.match(byPath['.github/workflows/pages.yml'], /id-token: write/);
  assert.equal((byPath['.github/workflows/pages.yml'].match(/uses: actions\/[^@]+@[a-f0-9]{40}/g) || []).length, 5);
});
test('React data excludes hidden sections and irrelevant fields, and renders user strings through JSX', () => {
  const project = generatorProject(); project.sections[1].visible = false;
  project.sections[1].content.description = 'PRIVATE_HIDDEN_CONTENT';
  project.sections[0].content.items[0].description = 'PRIVATE_IRRELEVANT_ENTRY';
  project.sections[0].content.heading = '</script><img src=x onerror=alert(1)>';
  const files = generateReactProject(project), output = files.map((file) => file.content).join('\n');
  assert.ok(!output.includes('PRIVATE_HIDDEN_CONTENT')); assert.ok(!output.includes('PRIVATE_IRRELEVANT_ENTRY'));
  const app = files.find((file) => file.path === 'src/App.jsx').content;
  assert.ok(!app.includes('dangerouslySetInnerHTML')); assert.match(app, /content.heading/);
  assert.equal(JSON.parse(files.find((file) => file.path === 'src/portfolio.json').content).sections.length, 6);
});
