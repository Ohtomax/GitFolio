import { readFileSync } from 'node:fs';
import { isRoleLayout, type ThemeConfig } from '@gitfolio/shared';

const definitions = {
  sans: { file: 'geist', family: 'Geist', weight: '100 900' },
  serif: { file: 'newsreader', family: 'Newsreader', weight: '200 800' },
  mono: { file: 'geist-mono', family: 'Geist Mono', weight: '100 900' },
  bento: { file: 'manrope', family: 'Manrope', weight: '200 800' },
  executive: { file: 'source-sans-3', family: 'Source Sans 3', weight: '200 900' },
};
const cache = new Map<string, string>();
export function portfolioFontStyles(theme: ThemeConfig): string {
  const body: keyof typeof definitions = theme.font === 'sans' && theme.layout === 'executive' ? 'executive' : theme.font;
  const headingStyle = theme.headingFont ?? theme.font;
  const heading: keyof typeof definitions = headingStyle === 'sans' && ['bento','quality','monochrome'].includes(theme.layout ?? '') ? 'bento'
    : headingStyle === 'sans' && theme.layout === 'executive' ? 'executive' : headingStyle;
  return [...new Set<keyof typeof definitions>([body, heading, ...(isRoleLayout(theme.layout) || theme.layout === 'monochrome' ? ['mono' as const] : [])])].map((key) => {
    const definition = definitions[key];
    if (!cache.has(key)) {
      const asset = new URL(`../../../assets/portfolio-fonts/${definition.file}.woff2`, import.meta.url);
      const license = readFileSync(new URL(`../../../assets/portfolio-fonts/${definition.file}.LICENSE`, import.meta.url), 'utf8');
      cache.set(key, `/* ${license.replace(/\*\//g, '* /')} */\n@font-face{font-family:'${definition.family}';font-style:normal;font-weight:${definition.weight};font-display:swap;src:url(data:font/woff2;base64,${readFileSync(asset).toString('base64')}) format('woff2')}\n`);
    }
    return cache.get(key)!;
  }).join('');
}
