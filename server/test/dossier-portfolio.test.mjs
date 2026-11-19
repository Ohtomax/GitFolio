import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { BUILTIN_TEMPLATES, TemplateSchema, buildPortfolioTree, serializePortfolioTree, portfolioRendererSource } from '@gitfolio/shared';
import { generateStaticSite } from '../dist/generators/static.generator.js';
import { generateReactProject } from '../dist/generators/react.generator.js';
import { generatorProject } from './helpers/portfolio.mjs';

const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'dossier');
function project() {
  return { ...generatorProject(), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), sortOrder, id: randomUUID() })) };
}

test('dossier uses original fictional cybersecurity examples and placeholder contact links', () => {
  TemplateSchema.parse(template);
  assert.equal(template.name, 'Sentinel / Cybersecurity Dossier');
  assert.equal(template.defaultConfig.theme.demo, true);
  assert.equal(BUILTIN_TEMPLATES.filter((preset) => preset.id === template.id).length, 1);
  const copy = JSON.stringify(template.defaultConfig);
  assert.match(copy, /Nadia Serrano/);
  assert.doesNotMatch(copy, /jason|echelon|trusttheguardian|portfolio_of_jason/i);
  for (const section of template.defaultConfig.sections) {
    const urls = [section.content.buttonUrl, ...(section.content.items ?? []).map((item) => item.url)].filter(Boolean);
    for (const url of urls) {
      if (url.startsWith('mailto:')) assert.equal(url, 'mailto:nadia@example.com');
      else assert.equal(new URL(url).hostname, 'example.com');
    }
  }
  assert.match(copy, /sandbox|authorized/);
  assert.match(copy, /not claims of professional certification/);
});

test('dossier exports share the live renderer, preserve edits, escape text, and omit hidden identity and navigation', () => {
  const data = project();
  data.sections.find((section) => section.type === 'projects').content.items[0].title = '<script>custom case</script>';
  const html = serializePortfolioTree(buildPortfolioTree(data));
  assert.match(html, /&lt;script&gt;custom case&lt;\/script&gt;/);
  assert.ok(!html.includes('<script>custom case'));
  assert.ok(!html.includes(' hidden='), 'Every section must remain readable without JavaScript.');
  const staticFiles = Object.fromEntries(generateStaticSite(data).map((file) => [file.path, file.content]));
  const reactFiles = Object.fromEntries(generateReactProject(data).map((file) => [file.path, file.content]));
  const exported = JSON.parse(reactFiles['src/portfolio.json']);
  const standaloneTree = runInNewContext(portfolioRendererSource('dossier') + '; renderTemplate(portfolio)', { portfolio: exported, URL });
  assert.equal(JSON.stringify(standaloneTree), JSON.stringify(buildPortfolioTree(data)));
  assert.ok(staticFiles['index.html'].includes(html));
  assert.match(staticFiles['script.js'], /data-dossier-shell/);
  assert.match(reactFiles['src/App.jsx'], /data-dossier-shell/);
  const hidden = data.sections.find((section) => section.type === 'projects');
  hidden.visible = false;
  data.sections.find((section) => section.type === 'hero').visible = false;
  for (const generate of [generateStaticSite, generateReactProject]) {
    const artifact = JSON.stringify(generate(data));
    assert.ok(!artifact.includes(hidden.id));
    assert.ok(!artifact.includes('custom case'));
    assert.ok(!artifact.includes('Nadia Serrano'));
  }
});
