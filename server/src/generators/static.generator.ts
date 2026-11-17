import Mustache from 'mustache';
import { ProjectSchema, PORTFOLIO_CSS, buildPortfolioTree, serializePortfolioTree, portfolioVariables, mountPortfolioInteractions, isRoleLayout, type Project, type ThemeConfig } from '@gitfolio/shared';
import { generateRoleStaticSite } from './role.generator.js';
import { validateArtifact, type GeneratedFile } from './artifact.js';
import { portfolioFontStyles } from './portfolio-fonts.js';

const fonts = { sans: 'ui-sans-serif, system-ui, sans-serif', serif: 'ui-serif, Georgia, serif', mono: 'ui-monospace, monospace' };
const spacing = { compact: '1.5rem', comfortable: '2.5rem', spacious: '4rem' };
export function portfolioStyles(theme: ThemeConfig) {
  if (theme.layout && theme.layout !== 'classic') {
    const variables = Object.entries(portfolioVariables(theme)).map(([key, value]) => `${key}:${value}`).join(';');
    return `${portfolioFontStyles(theme)}\n:root{${variables};color:var(--pf-text);background:var(--pf-bg)}body{margin:0}*{box-sizing:border-box}\n${PORTFOLIO_CSS}`;
  }
  const channels = [1, 3, 5].map((index) => parseInt(theme.colors.accent.slice(index, index + 2), 16) / 255)
    .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  return Mustache.render(`:root{--bg:{{background}};--text:{{text}};--accent:{{accent}};--on-accent:{{onAccent}};--space:{{space}};font-family:{{font}};color:var(--text);background:var(--bg);font-synthesis:none;text-rendering:optimizeLegibility}
*{box-sizing:border-box}body{margin:0;overflow-wrap:anywhere}a{color:inherit;text-underline-offset:4px}a:focus-visible{outline:2px solid currentColor;outline-offset:4px}button,a{-webkit-tap-highlight-color:transparent}.portfolio{max-width:1100px;margin:auto;container-type:inline-size}.portfolio-nav{display:flex;flex-wrap:wrap;gap:1rem;padding:1.5rem;border-bottom:1px solid color-mix(in srgb,var(--text) 14%,transparent);font-size:.8rem}.portfolio-section{padding:var(--space) 1.5rem;border-bottom:1px solid color-mix(in srgb,var(--text) 14%,transparent);scroll-margin-top:1rem}.portfolio-section h2{margin:0;font-size:1.5rem;line-height:1.2;letter-spacing:-.03em}.portfolio-section.hero h2{font-size:clamp(2rem,7cqi,4rem)}.portfolio-eyebrow{color:var(--accent);font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;margin:0 0 1rem}.portfolio-description{opacity:.7;line-height:1.85;font-size:.875rem;white-space:pre-wrap;max-width:48rem;margin:1.25rem 0 0}.portfolio-action{display:inline-block;margin-top:1.75rem;border-radius:.65rem;padding:.75rem 1.1rem;background:var(--accent);color:var(--on-accent);font-size:.8rem;font-weight:600;text-decoration:none}.portfolio-entries{display:grid;gap:1rem;margin-top:1.75rem}.portfolio-card{border:1px solid color-mix(in srgb,var(--text) 18%,transparent);border-radius:.85rem;padding:1.25rem;min-width:0}.portfolio-card h3{font-size:1rem;margin:0;color:var(--accent)}.portfolio-subtitle{opacity:.7;font-size:.75rem;line-height:1.8}.portfolio-card .portfolio-description{margin-top:.75rem}.portfolio-footer{padding:2rem 1.5rem;font-size:.75rem;opacity:.65}@container(min-width:540px){.portfolio-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
`, { ...theme.colors, onAccent: (luminance + .05) / .05 >= 1.05 / (luminance + .05) ? '#000000' : '#ffffff',
    font: fonts[theme.font], space: spacing[theme.spacing] });
}
const sectionPartial = `<section id="section-{{id}}" class="portfolio-section {{type}}" aria-label="{{heading}}">
{{#eyebrow}}<p class="portfolio-eyebrow">{{eyebrow}}</p>{{/eyebrow}}<h2>{{heading}}</h2>
{{#description}}<p class="portfolio-description">{{description}}</p>{{/description}}
{{#hasItems}}<div class="portfolio-entries {{#grid}}portfolio-grid{{/grid}}">{{#items}}<article class="portfolio-card"><h3>{{#url}}<a href="{{url}}" target="_blank" rel="noopener noreferrer">{{title}}</a>{{/url}}{{^url}}{{title}}{{/url}}</h3>{{#subtitle}}<p class="portfolio-subtitle">{{subtitle}}</p>{{/subtitle}}{{#description}}<p class="portfolio-description">{{description}}</p>{{/description}}</article>{{/items}}</div>{{/hasItems}}
{{#buttonLabel}}{{#buttonUrl}}<a class="portfolio-action" href="{{buttonUrl}}" target="_blank" rel="noopener noreferrer">{{buttonLabel}}</a>{{/buttonUrl}}{{^buttonUrl}}<span class="portfolio-action">{{buttonLabel}}</span>{{/buttonUrl}}{{/buttonLabel}}
</section>`;
const pageTemplate = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>{{name}}</title><link rel="stylesheet" href="./style.css"><script src="./script.js" defer></script></head>
<body><main class="portfolio"><nav class="portfolio-nav" aria-label="Portfolio sections">{{#sections}}<a href="#section-{{id}}">{{heading}}</a>{{/sections}}</nav>{{#sections}}{{> section}}{{/sections}}{{^sections}}<section class="portfolio-section"><h2>{{name}}</h2></section>{{/sections}}<footer class="portfolio-footer">{{name}} · <span data-year></span></footer></main></body></html>
`;
export function generateStaticSite(input: Project): GeneratedFile[] {
  const project = ProjectSchema.parse(input);
  if (isRoleLayout(project.themeConfig.layout)) return generateRoleStaticSite(project);
  if (project.themeConfig.layout && project.themeConfig.layout !== 'classic') {
    const tree = buildPortfolioTree({ ...project, sections: [...project.sections].sort((a, b) => a.sortOrder - b.sortOrder) });
    const html = Mustache.render('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{name}}</title><link rel="stylesheet" href="./style.css"><script src="./script.js" defer></script></head><body>{{{content}}}</body></html>\n',
      { name: project.name, content: serializePortfolioTree(tree) });
    // Only the application-generated semantic tree is unescaped above. Every user
    // string and attribute was escaped by serializePortfolioTree, including URLs.
    return validateArtifact([{ path: 'index.html', content: html }, { path: 'style.css', content: portfolioStyles(project.themeConfig) },
      { path: 'script.js', content: `(${mountPortfolioInteractions.toString()})(document);\n` }, { path: '.nojekyll', content: '' }]);
  }
  const sections = [...project.sections].sort((a, b) => a.sortOrder - b.sortOrder).filter((section) => section.visible).map((section) => {
    const list = ['projects', 'skills', 'experience', 'education'].includes(section.type);
    return { id: section.id, type: section.type, ...section.content,
      heading: section.content.heading || section.type[0].toUpperCase() + section.type.slice(1),
      eyebrow: section.type === 'hero' ? section.content.eyebrow : undefined,
      buttonLabel: ['hero', 'contact'].includes(section.type) ? section.content.buttonLabel : undefined,
      hasItems: list && Boolean(section.content.items?.length), grid: ['projects', 'skills'].includes(section.type),
      items: list ? section.content.items?.map((item) => ({ title: item.title || 'Untitled entry',
        subtitle: item.subtitle ?? '', description: item.description ?? '', url: item.url ?? '' })) : [] };
  });
  return validateArtifact([
    { path: 'index.html', content: Mustache.render(pageTemplate, { name: project.name, sections }, { section: sectionPartial }) },
    { path: 'style.css', content: portfolioStyles(project.themeConfig) },
    { path: 'script.js', content: "document.querySelectorAll('[data-year]').forEach((node)=>{node.textContent=String(new Date().getFullYear());});\n" },
    { path: '.nojekyll', content: '' },
  ]);
}
