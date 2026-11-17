import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { generateStaticSite } from '../dist/generators/static.generator.js';
import { validateArtifact } from '../dist/generators/artifact.js';

export function generatorProject() {
  const template = { id: randomUUID(), name: 'Canvas', description: 'A fixture', category: 'minimal', thumbnailUrl: null, isReact: false };
  return { id: randomUUID(), templateId: template.id, template, name: 'My portfolio', slug: 'my-portfolio', repoName: null,
    status: 'DRAFT', editorRevision: 0, sectionCount: 7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    themeConfig: { colors: { accent: '#65a30d', background: '#fafaf9', text: '#1c1917' }, font: 'serif', spacing: 'compact' },
    sections: ['hero', 'about', 'projects', 'skills', 'experience', 'education', 'contact'].map((type, sortOrder) => ({ id: randomUUID(), type, sortOrder, visible: true,
      content: { heading: `My ${type}`, description: `About ${type}`, eyebrow: 'Welcome', buttonLabel: 'Contact', buttonUrl: 'mailto:fixture@example.test',
        items: [{ title: `${type} entry`, subtitle: 'Detail', description: 'A description', url: 'https://example.com/work' }] } })) };
}
test('Mustache generates complete deterministic portable files with ordered visible sections and themes', () => {
  const project = generatorProject(); project.sections[1].visible = false;
  project.sections[2].content.items[0] = { title: 'projects entry' };
  const files = generateStaticSite(project), html = files.find((file) => file.path === 'index.html').content;
  assert.deepEqual(files, generateStaticSite(project));
  assert.match(html, /My hero/); assert.ok(!html.includes('My about'));
  assert.ok(html.indexOf('My projects</h2>') < html.indexOf('My skills</h2>'));
  assert.match(html, /projects entry/); assert.match(html, /rel="noopener noreferrer"/);
  assert.equal(html.split('About projects').length - 1, 1);
  assert.match(html, /href="\.\/style.css"/); assert.match(html, /src="\.\/script.js"/);
  assert.match(files.find((file) => file.path === 'style.css').content, /--space:1.5rem/);
  assert.match(files.find((file) => file.path === 'style.css').content, /ui-serif/);
});
test('untrusted markup is escaped, unsafe links and CSS fail validation, and file paths cannot escape the artifact', () => {
  const project = generatorProject(); project.sections[0].content.heading = '<script>alert("x")</script>';
  const html = generateStaticSite(project)[0].content;
  assert.ok(!html.includes('<script>alert')); assert.match(html, /&lt;script&gt;/);
  project.sections[0].content.buttonUrl = 'javascript:alert(1)'; assert.throws(() => generateStaticSite(project));
  project.sections[0].content.buttonUrl = ''; project.themeConfig.colors.text = 'red;}</style><script>';
  assert.throws(() => generateStaticSite(project));
  for (const path of ['../secret', '/absolute', 'folder/../../secret', 'folder\\secret']) assert.throws(() => validateArtifact([{ path, content: '' }]));
});
