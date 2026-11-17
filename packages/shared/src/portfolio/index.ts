import type { Template } from '../validation/template.schema.js';
import { el, main, pageFrame, sectionShell, sectionHeading, type PortfolioDocument, type PortfolioElement } from './tree.js';
import { PORTFOLIO_BASE_CSS } from './styles.js';

export const BUILTIN_TEMPLATES: Template[] = [];
export const PORTFOLIO_CSS = PORTFOLIO_BASE_CSS;
export function buildPortfolioTree(document: PortfolioDocument): PortfolioElement {
  const sections = document.sections.filter((section) => section.visible);
  return pageFrame(document, main(sections.map((section) => sectionShell(section, sectionHeading(section)))));
}
export { portfolioVariables, accentText, contrastRatio } from './theme.js';
export { serializePortfolioTree, type PortfolioDocument, type PortfolioElement, type PortfolioNode } from './tree.js';
export { mountPortfolioInteractions } from './interactions.js';
