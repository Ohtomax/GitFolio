import { createElement, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { buildPortfolioTree, portfolioVariables, mountPortfolioInteractions, PORTFOLIO_CSS,
  type PortfolioNode, type PortfolioDocument } from '@gitfolio/shared';
import './portfolio-fonts.css';

export function DesignedPortfolio({ document, selectedId, onSelect, interactive = false, thumbnail = false }: {
  document: PortfolioDocument; selectedId?: string | null; onSelect?: (id: string) => void; interactive?: boolean; thumbnail?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tree = useMemo(() => buildPortfolioTree(document), [document]);
  useEffect(() => { if (interactive && ref.current) return mountPortfolioInteractions(ref.current); }, [tree, interactive]);
  function render(node: PortfolioNode, key: number | string): ReactNode {
    if (typeof node === 'string') return node;
    const { class: className = '', tabindex, ...attrs } = node.attrs;
    const sectionId = attrs['data-section-id'];
    const children = node.children.map((child, i) => render(child, i));
    if (sectionId && onSelect) children.unshift(<button key="edit" className="pf-edit" type="button" aria-pressed={selectedId === sectionId}
      aria-label={`Select ${attrs['data-section-type']} section`} onClick={() => onSelect(sectionId)}>Edit {attrs['data-section-type']}</button>);
    const isExternal = node.tag === 'a' && !attrs.href?.startsWith('#');
    if ((!interactive || thumbnail) && isExternal) { delete attrs.href; delete attrs.target; delete attrs.rel; }
    if (thumbnail) { delete attrs.id; delete attrs['aria-label']; }
    return createElement(node.tag === 'a' && isExternal && (!interactive || thumbnail) ? 'span' : node.tag,
      { ...attrs, className: `${className}${sectionId && onSelect && selectedId === sectionId ? ' pf-selected' : ''}`,
        ...(tabindex ? { tabIndex: Number(tabindex) } : {}), ...(thumbnail ? { tabIndex: -1 } : {}),
        ...(['input', 'button'].includes(node.tag) && (!interactive || thumbnail) ? { disabled: true } : {}), key },
      ...(node.tag === 'input' ? [] : children));
  }
  return <div ref={ref} className={thumbnail ? 'pf-thumbnail-content' : 'min-h-[400px] shadow-sm'}
    style={portfolioVariables(document.themeConfig) as CSSProperties} role={thumbnail ? undefined : 'region'} aria-label={thumbnail ? undefined : 'Portfolio preview'}>
    <style>{PORTFOLIO_CSS}</style>{render(tree, 'page')}
  </div>;
}
