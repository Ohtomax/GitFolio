import type { ThemeConfig } from '../validation/template.schema.js';

export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
export const accentText = (color: string) => contrastRatio(color, '#000000') >= contrastRatio(color, '#FFFFFF') ? '#000000' : '#FFFFFF';
export function portfolioVariables(theme: ThemeConfig): Record<string, string> {
  const sans = theme.layout === 'executive' ? "'Source Sans 3', ui-sans-serif, system-ui, sans-serif" : "'Geist', ui-sans-serif, system-ui, sans-serif";
  const fonts = { sans, serif: "'Newsreader', ui-serif, Georgia, serif", mono: "'Geist Mono', ui-monospace, monospace" };
  const geometricHeading = theme.layout === 'bento' && (theme.headingFont ?? 'sans') === 'sans'
    || ['monochrome', 'kinetic', 'obsidian'].includes(theme.layout ?? '') && (theme.headingFont ?? theme.font) === 'sans';
  const headingFont = geometricHeading ? "'Manrope', ui-sans-serif, system-ui, sans-serif" : fonts[theme.headingFont ?? theme.font];
  return { '--pf-bg': theme.colors.background, '--pf-text': theme.colors.text,
    '--pf-accent': theme.colors.accent, '--pf-on-accent': accentText(theme.colors.accent),
    '--pf-muted': theme.colors.muted ?? theme.colors.text, '--pf-surface': theme.colors.surface ?? theme.colors.background,
    '--pf-border': theme.colors.border ?? theme.colors.muted ?? theme.colors.text,
    '--pf-font': fonts[theme.font], '--pf-heading-font': headingFont,
    '--pf-space': { compact: '1.5rem', comfortable: '2.5rem', spacious: '4rem' }[theme.spacing] };
}
