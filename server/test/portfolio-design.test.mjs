import assert from 'node:assert/strict';
import test from 'node:test';
import { ThemeConfigSchema, SectionContentSchema, buildPortfolioTree, serializePortfolioTree, contrastRatio } from '@gitfolio/shared';

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
