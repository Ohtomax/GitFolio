import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { BUILTIN_TEMPLATES, TemplateSchema, TemplateQuerySchema, buildPortfolioTree, serializePortfolioTree, portfolioRendererSource } from '@gitfolio/shared';
import { generateStaticSite } from '../dist/generators/static.generator.js';
import { generateReactProject } from '../dist/generators/react.generator.js';
import { generatorProject } from './helpers/portfolio.mjs';

const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'kinetic');
function project() {
  return { ...generatorProject(), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), sortOrder, id: randomUUID() })) };
}

test('Premium is a validated category with an original animated portfolio and safe example links', () => {
  TemplateSchema.parse(template);
  assert.equal(TemplateQuerySchema.parse({ category: 'premium' }).category, 'premium');
  assert.equal(template.category, 'premium');
  assert.equal(template.defaultConfig.theme.demo, true);
  assert.equal(BUILTIN_TEMPLATES.filter((preset) => preset.id === template.id).length, 1);
  const content = JSON.stringify(template.defaultConfig);
  assert.match(content, /Riley Vale/);
  assert.doesNotMatch(content, /joonas|sandell|biocode|mediasignal|freepress|oras faucet/i);
  for (const section of template.defaultConfig.sections) {
    for (const url of [section.content.buttonUrl, ...(section.content.items ?? []).map((item) => item.url)].filter(Boolean)) {
      if (url.startsWith('mailto:')) assert.equal(url, 'mailto:riley@example.com');
      else assert.equal(new URL(url).hostname, 'example.com');
    }
  }
});

test('kinetic static and standalone React exports retain editable content, bundled fonts, and motion controls', () => {
  const data = project();
  data.sections[0].content.portraitUrl = 'https://example.com/riley/portrait.png';
  data.sections[0].content.portraitAlt = 'Custom portrait <script>escaped</script>';
  data.sections[1].content.items[0].title = 'My own concept';
  const files = Object.fromEntries(generateStaticSite(data).map((file) => [file.path, file.content]));
  const react = Object.fromEntries(generateReactProject(data).map((file) => [file.path, file.content]));
  const exported = JSON.parse(react['src/portfolio.json']);
  const standalone = runInNewContext(portfolioRendererSource('kinetic') + '; renderTemplate(portfolio)', { portfolio: exported, URL });
  assert.equal(JSON.stringify(standalone), JSON.stringify(buildPortfolioTree(data)));
  const html = serializePortfolioTree(buildPortfolioTree(data));
  assert.ok(files['index.html'].includes(html));
  assert.match(html, /Custom portrait &lt;script&gt;escaped&lt;\/script&gt;/);
  assert.match(html, /data-kinetic-motion/);
  assert.ok(!html.includes('data-kinetic-enhanced'), 'Content must stay visible without JavaScript.');
  assert.match(files['style.css'], /font-family:'Manrope'/);
  assert.match(files['style.css'], /prefers-reduced-motion/);
  assert.match(react['src/App.jsx'], /data-kinetic-motion/);
  data.sections[0].visible = false; data.sections[1].visible = false;
  for (const generate of [generateStaticSite, generateReactProject]) {
    const artifact = JSON.stringify(generate(data));
    assert.ok(!artifact.includes('My own concept'));
    assert.ok(!artifact.includes('riley/portrait.png'));
    assert.ok(!artifact.includes('Riley Vale'));
  }
});

test('kinetic project scenes use validated links and escape oversized project lettering', () => {
  const data = project();
  const item = data.sections[1].content.items[0];
  item.title = '<img src=x onerror=alert(1)>';
  item.url = 'javascript:alert(1)';
  const html = serializePortfolioTree(buildPortfolioTree(data));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('<img src=x'));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /data-kinetic-scroll/);
});
