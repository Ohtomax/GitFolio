import type { Template } from '../validation/template.schema.js';
import { el, main, pageFrame, sectionShell, sectionHeading, sectionNames, entry, itemsFor, art, action, metrics, tags, navigation, link,
  type PortfolioDocument, type PortfolioElement } from './tree.js';
import { isPortfolioUrl } from '../validation/section-content.schema.js';
import { isRoleLayout } from './role-contracts.js';
import { PORTFOLIO_BASE_CSS } from './styles.js';
import { minimalTemplate, renderMinimal, MINIMAL_CSS } from './minimal.js';
import { terminalTemplate, renderTerminal, TERMINAL_CSS } from './terminal.js';
import { editorialTemplate, renderEditorial, EDITORIAL_CSS } from './editorial.js';
import { bentoTemplate, renderBento, BENTO_CSS } from './bento.js';
import { executiveTemplate, renderExecutive, EXECUTIVE_CSS } from './executive.js';
import { backendTemplate } from './roles/backend.js';
import { securityTemplate } from './roles/security.js';
import { qualityTemplate } from './roles/quality.js';
import { frontendTemplate } from './roles/frontend.js';
import { fullstackTemplate } from './roles/fullstack.js';
import { cyberHudTemplate } from './cyber-hud.js';

export const BUILTIN_TEMPLATES: Template[] = [
  minimalTemplate, terminalTemplate, editorialTemplate, bentoTemplate, executiveTemplate,
  backendTemplate, securityTemplate, qualityTemplate, frontendTemplate, fullstackTemplate,
  cyberHudTemplate,
];
export const PORTFOLIO_CSS = PORTFOLIO_BASE_CSS + MINIMAL_CSS + TERMINAL_CSS + EDITORIAL_CSS + BENTO_CSS + EXECUTIVE_CSS;
export function buildPortfolioTree(document: PortfolioDocument): PortfolioElement {
  if (document.themeConfig.layout === 'minimal') return renderMinimal(document);
  if (document.themeConfig.layout === 'terminal') return renderTerminal(document);
  if (document.themeConfig.layout === 'editorial') return renderEditorial(document);
  if (document.themeConfig.layout === 'bento') return renderBento(document);
  if (document.themeConfig.layout === 'executive') return renderExecutive(document);
  const sections = document.sections.filter((section) => section.visible);
  return pageFrame(document, main(sections.map((section) => sectionShell(section, sectionHeading(section)))));
}
export function portfolioRendererSource(layout: PortfolioDocument['themeConfig']['layout']): string {
  const renderers = { minimal: renderMinimal, terminal: renderTerminal, editorial: renderEditorial, bento: renderBento, executive: renderExecutive };
  if (!layout || layout === 'classic' || isRoleLayout(layout)) throw new Error('A design layout is required');
  // These are application-owned functions compiled by TypeScript, never user code.
  // Keeping the actual renderer in the export makes portfolio.json editable and
  // avoids freezing a second, stale copy of its content in a pre-rendered tree.
  return [`const sectionNames = ${JSON.stringify(sectionNames)};`,
    ...Object.entries({ el, main, pageFrame, sectionShell, sectionHeading, entry, itemsFor, art, action, metrics, tags, navigation, link, isPortfolioUrl })
      .map(([name, fn]) => `const ${name} = ${fn.toString()};`),
    `const renderTemplate = ${renderers[layout].toString()};`].join('\n');
}
export { portfolioVariables, accentText, contrastRatio } from './theme.js';
export { serializePortfolioTree, type PortfolioDocument, type PortfolioElement, type PortfolioNode } from './tree.js';
export { mountPortfolioInteractions } from './interactions.js';
