import type { RolePortfolioProps } from './shared/contracts.ts';
import '../editor/portfolio-fonts.css';
import { BackendPortfolio } from './backend/BackendPortfolio.tsx';

export function RoleTemplatePreview(props: RolePortfolioProps) {
  if(props.document.themeConfig.layout==='backend')return <BackendPortfolio {...props} />;
  return null;
}
