import type { CSSProperties, ReactNode } from 'react';
import type { ThemeConfig } from '@gitfolio/shared';
import './portfolio.css';

export function accentTextColor(hex: string): '#000000' | '#ffffff' {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
}
const fonts = { sans: 'font-sans', serif: 'font-serif', mono: 'font-mono' };
const spacing = { compact: '[--portfolio-space:1.5rem]', comfortable: '[--portfolio-space:2.5rem]', spacious: '[--portfolio-space:4rem]' };
export function ThemeSurface({ theme, children, className = '', label }: {
  theme: ThemeConfig; children: ReactNode; className?: string; label?: string;
}) {
  // Arbitrary validated theme colors require CSS variables; dimensions and layout use static classes.
  const variables = { '--portfolio-bg': theme.colors.background, '--portfolio-text': theme.colors.text,
    '--portfolio-accent': theme.colors.accent, '--portfolio-on-accent': accentTextColor(theme.colors.accent) } as CSSProperties;
  return <div role={label ? 'region' : undefined} aria-label={label} style={variables}
    className={`portfolio-surface ${fonts[theme.font]} ${spacing[theme.spacing]} ${className}`}>{children}</div>;
}
