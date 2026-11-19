import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { BUILTIN_TEMPLATES, TemplateSchema, TemplateQuerySchema, buildPortfolioTree, serializePortfolioTree, portfolioRendererSource } from '@gitfolio/shared';
import { generateStaticSite } from '../dist/generators/static.generator.js';
import { generateReactProject } from '../dist/generators/react.generator.js';
import { generatorProject } from './helpers/portfolio.mjs';

const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'obsidian');
function project() {
  const sections = template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), sortOrder, id: randomUUID() }));
  return { ...generatorProject(), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme), sections, sectionCount: sections.length };
}

test('Obsidian is a premium preset with original, editable sample content', () => {
  TemplateSchema.parse(template);
  assert.equal(template.category, 'premium');
  assert.equal(TemplateQuerySchema.parse({ category: template.category }).category, 'premium');
  assert.equal(template.defaultConfig.theme.demo, true);
  assert.equal(BUILTIN_TEMPLATES.filter((preset) => preset.id === template.id).length, 1);
  const content = JSON.stringify(template.defaultConfig);
  assert.match(content, /Alex Morgan/);
  assert.doesNotMatch(content, /Abhiman|Panwar|Metamorpher|KroszTube|kroszborg/i);
  for (const section of template.defaultConfig.sections) {
    for (const url of [section.content.buttonUrl, ...(section.content.items ?? []).map((item) => item.url)].filter(Boolean)) {
      if (url.startsWith('mailto:')) assert.equal(url, 'mailto:alex@example.com');
      else assert.equal(new URL(url).hostname, 'example.com');
    }
  }
});

test('Obsidian preserves edits and shares its renderer with static and standalone React exports', () => {
  const data = project();
  const hero = data.sections.find((section) => section.type === 'hero');
  hero.content.heading = 'Avery Quinn';
  hero.content.portraitUrl = 'https://example.com/custom-portrait.png';
  hero.content.portraitAlt = 'A custom portrait';
  data.sections.find((section) => section.type === 'projects').content.items[0].title = 'My edited project';
  const tree = buildPortfolioTree(data);
  const html = serializePortfolioTree(tree);
  assert.match(html, /Avery Quinn/);
  assert.match(html, /custom-portrait\.png/);
  assert.match(html, /referrerpolicy="no-referrer"/);
  assert.match(html, /My edited project/);
  assert.match(html, /data-obsidian-page/);
  assert.match(html, /data-obsidian-reveal/);
  assert.match(html, /Pause motion/);
  const files = Object.fromEntries(generateStaticSite(data).map((file) => [file.path, file.content]));
  assert.ok(files['index.html'].includes(html));
  assert.match(files['script.js'], /data-obsidian-page/);
  const reactFiles = Object.fromEntries(generateReactProject(data).map((file) => [file.path, file.content]));
  const exported = JSON.parse(reactFiles['src/portfolio.json']);
  const standalone = runInNewContext(portfolioRendererSource('obsidian') + '; renderTemplate(portfolio)', { portfolio: exported, URL });
  assert.equal(JSON.stringify(standalone), JSON.stringify(tree));
  assert.match(reactFiles['src/style.css'], /font-family:'Manrope'/);
  assert.match(reactFiles['src/App.jsx'], /data-obsidian-page/);
  assert.match(reactFiles['src/style.css'], /@keyframes pf-obsidian-drift/);
});

test('Obsidian escapes user content and rejects unsafe links and portraits in its renderer', () => {
  const data = project();
  const hero = data.sections.find((section) => section.type === 'hero');
  hero.content.heading = '<script>unsafe-name</script>';
  hero.content.portraitUrl = 'javascript:alert(1)';
  const experience = data.sections.find((section) => section.type === 'experience');
  experience.content.items[0].url = 'javascript:alert(2)';
  experience.content.items[0].description = '<img src=x onerror=alert(3)>';
  const html = serializePortfolioTree(buildPortfolioTree(data));
  assert.match(html, /&lt;script&gt;unsafe-name&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=alert\(3\)&gt;/);
  assert.ok(!html.includes('<script>unsafe-name'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('src="javascript:'));
});

test('Obsidian omits hidden identity, profile links, and writing from both exports', () => {
  const data = project();
  const hidden = data.sections.filter((section) => ['hero', 'contact', 'writing'].includes(section.type));
  hidden.forEach((section) => { section.visible = false; });
  for (const generate of [generateStaticSite, generateReactProject]) {
    const files = JSON.stringify(generate(data));
    assert.ok(!files.includes('Alex Morgan'));
    assert.ok(!files.includes('alex@example.com'));
    assert.ok(!files.includes('Making background work feel immediate'));
    for (const section of hidden) assert.ok(!files.includes(section.id));
  }
  const html = serializePortfolioTree(buildPortfolioTree(data));
  assert.match(html, /pf-obsidian-no-profile/);
  for (const [, id] of html.matchAll(/href="#portfolio-([^"\s]+)"/g)) assert.ok(html.includes(`id="portfolio-${id}"`));
});
