import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { BUILTIN_TEMPLATES, PortfolioImageUrlSchema, SectionContentSchema, buildPortfolioTree, serializePortfolioTree, portfolioRendererSource } from '@gitfolio/shared';
import { generateStaticSite } from '../dist/generators/static.generator.js';
import { generateReactProject } from '../dist/generators/react.generator.js';
import { generatorProject } from './helpers/portfolio.mjs';

const template = BUILTIN_TEMPLATES.find((preset) => preset.defaultConfig.theme.layout === 'monochrome');
function project() {
  return { ...generatorProject(), templateId: template.id, template, themeConfig: structuredClone(template.defaultConfig.theme),
    sections: template.defaultConfig.sections.map((section, sortOrder) => ({ ...structuredClone(section), sortOrder, id: randomUUID() })) };
}

test('monochrome portrait accepts only bounded public HTTP image links and escapes descriptions', () => {
  for (const url of ['', 'https://example.com/portrait.png', 'http://localhost:5173/portrait.png']) PortfolioImageUrlSchema.parse(url);
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'mailto:me@example.com', 'https://user:password@example.com/photo', '//example.com/photo', 'https://example.com/' + 'a'.repeat(2048)]) {
    assert.equal(PortfolioImageUrlSchema.safeParse(url).success, false);
  }
  const data = project();
  const content = data.sections[0].content;
  content.portraitUrl = 'https://example.com/portrait.png';
  content.portraitAlt = 'Portrait <script>alert(1)</script>';
  SectionContentSchema.parse(content);
  const html = serializePortfolioTree(buildPortfolioTree(data));
  assert.match(html, /<img[^>]+src="https:\/\/example.com\/portrait.png"/);
  assert.match(html, /alt="Portrait &lt;script&gt;alert\(1\)&lt;\/script&gt;"/);
  assert.ok(!html.includes('</img>'));
  content.portraitUrl = 'javascript:alert(1)';
  assert.ok(!serializePortfolioTree(buildPortfolioTree(data)).includes('<img'));
});

test('monochrome static and standalone React exports preserve editable portraits and self-contained rendering', () => {
  const data = project();
  data.sections[0].content.portraitUrl = 'https://example.com/portrait.png';
  data.sections[0].content.portraitAlt = 'A custom portrait';
  const staticFiles = Object.fromEntries(generateStaticSite(data).map((file) => [file.path, file.content]));
  const reactFiles = Object.fromEntries(generateReactProject(data).map((file) => [file.path, file.content]));
  const exported = JSON.parse(reactFiles['src/portfolio.json']);
  assert.equal(exported.sections[0].content.portraitUrl, data.sections[0].content.portraitUrl);
  assert.equal(exported.sections[0].content.portraitAlt, 'A custom portrait');
  const standaloneTree = runInNewContext(portfolioRendererSource('monochrome') + '; renderTemplate(portfolio)', { portfolio: exported, URL });
  assert.equal(JSON.stringify(standaloneTree), JSON.stringify(buildPortfolioTree(data)));
  assert.match(staticFiles['style.css'], /font-family:'Manrope'/);
  assert.match(staticFiles['style.css'], /font-family:'Geist Mono'/);
  data.sections[0].visible = false;
  for (const generate of [generateStaticSite, generateReactProject]) assert.ok(!JSON.stringify(generate(data)).includes('https://example.com/portrait.png'));
});
