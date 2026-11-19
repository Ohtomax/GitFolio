import assert from 'node:assert/strict';
import test from 'node:test';
import { BUILTIN_TEMPLATES, isRoleLayout, ThemeConfigSchema, SectionContentSchema, buildPortfolioTree, serializePortfolioTree, contrastRatio } from '@gitfolio/shared';
import { randomUUID } from 'node:crypto';
import { generateStaticSite } from '../dist/generators/static.generator.js';
import { generateReactProject } from '../dist/generators/react.generator.js';
import { generatorProject } from './helpers/portfolio.mjs';

for (const template of BUILTIN_TEMPLATES.filter((item) => !isRoleLayout(item.defaultConfig.theme.layout))) test(`${template.name}: accessible preset, complete editable content, and identical export composition`, () => {
  const project = { ...generatorProject(), templateId: template.id, template, themeConfig: template.defaultConfig.theme,
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), sortOrder, id: randomUUID() })) };
  for (const type of ['hero','projects','contact']) assert.ok(project.sections.some((s) => s.type === type));
  const colors = project.themeConfig.colors;
  for (const foreground of ['text','muted','accent']) for (const background of ['background','surface']) assert.ok(contrastRatio(colors[foreground],colors[background]) >= 4.5, `${foreground}/${background}`);
  const staticFiles = Object.fromEntries(generateStaticSite(project).map((f) => [f.path,f.content]));
  const reactFiles = Object.fromEntries(generateReactProject(project).map((f) => [f.path,f.content]));
  const tree = buildPortfolioTree(project);
  assert.ok(staticFiles['index.html'].includes(serializePortfolioTree(tree)));
  const exported = JSON.parse(reactFiles['src/portfolio.json']);
  assert.deepEqual(buildPortfolioTree(exported), tree);
  assert.equal(exported.tree, undefined, 'React content must be rendered from editable sections');
  assert.match(reactFiles['src/App.jsx'], /renderTemplate\(portfolio\)/);
  assert.match(staticFiles['style.css'], /data:font\/woff2;base64,/);
  assert.match(staticFiles['style.css'], /SIL OPEN FONT LICENSE/);
  assert.match(staticFiles['index.html'], /Illustrative portfolio/);
  assert.ok(!reactFiles['src/App.jsx'].includes('dangerouslySetInnerHTML'));
  project.sections[1].visible = false; project.sections[1].content.heading = 'PRIVATE_HIDDEN_DESIGN';
  assert.ok(!JSON.stringify(generateReactProject(project)).includes('PRIVATE_HIDDEN_DESIGN'));
  assert.ok(!JSON.stringify(generateStaticSite(project)).includes('PRIVATE_HIDDEN_DESIGN'));
});

test('rich presentation fields are optional for legacy drafts and remain strictly bounded', () => {
  const legacy = { colors: { accent: '#000000', background: '#FFFFFF', text: '#111111' }, font: 'sans', spacing: 'spacious' };
  assert.deepEqual(ThemeConfigSchema.parse(legacy), legacy);
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.throws(() => ThemeConfigSchema.parse({ ...legacy, layout: 'arbitrary-code' }));
  assert.throws(() => ThemeConfigSchema.parse({ ...legacy, colors: { ...legacy.colors, muted: 'red;}' } }));
  const content = { heading: 'A thoughtful portfolio', description: '', metrics: [{ value: '38%', label: 'Less time waiting' }], tags: ['React'], items: [{ title: 'Atlas', visual: 'dashboard' }] };
  SectionContentSchema.parse(content);
  assert.throws(() => SectionContentSchema.parse({ ...content, metrics: Array(5).fill(content.metrics[0]) }));
  assert.throws(() => SectionContentSchema.parse({ ...content, items: [{ title: 'Unsafe', url: 'javascript:alert(1)' }] }));
  const document = { themeConfig: { ...legacy, layout: 'minimal' }, sections: [{ id: 'fixture', type: 'hero', visible: true, content: { heading: '<script>unsafe</script>', description: 'A & B' } }] };
  const html = serializePortfolioTree(buildPortfolioTree(document));
  assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
  assert.ok(html.includes('A &amp; B'));
  assert.ok(!html.includes('<script>unsafe'));
});
