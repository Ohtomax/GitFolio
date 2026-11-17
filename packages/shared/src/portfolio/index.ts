import type { Template } from '../validation/template.schema.js';
import { el, main, pageFrame, sectionShell, sectionHeading, type PortfolioDocument, type PortfolioElement } from './tree.js';
import { PORTFOLIO_BASE_CSS } from './styles.js';
import { minimalTemplate, renderMinimal, MINIMAL_CSS } from './minimal.js';
import { terminalTemplate, renderTerminal, TERMINAL_CSS } from './terminal.js';
import { editorialTemplate, renderEditorial, EDITORIAL_CSS } from './editorial.js';
import { bentoTemplate, renderBento, BENTO_CSS } from './bento.js';

export const BUILTIN_TEMPLATES: Template[] = [minimalTemplate, terminalTemplate, editorialTemplate, bentoTemplate];
export const PORTFOLIO_CSS = PORTFOLIO_BASE_CSS + MINIMAL_CSS + TERMINAL_CSS + EDITORIAL_CSS + BENTO_CSS;
export function buildPortfolioTree(document: PortfolioDocument): PortfolioElement {
  if (document.themeConfig.layout === 'minimal') return renderMinimal(document);
  if (document.themeConfig.layout === 'terminal') return renderTerminal(document);
  if (document.themeConfig.layout === 'editorial') return renderEditorial(document);
  if (document.themeConfig.layout === 'bento') return renderBento(document);
  const sections = document.sections.filter((section) => section.visible);
  return pageFrame(document, main(sections.map((section) => sectionShell(section, sectionHeading(section)))));
}
export { portfolioVariables, accentText, contrastRatio } from './theme.js';
export { serializePortfolioTree, type PortfolioDocument, type PortfolioElement, type PortfolioNode } from './tree.js';
export { mountPortfolioInteractions } from './interactions.js';
