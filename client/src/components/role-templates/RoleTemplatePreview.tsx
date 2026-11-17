import type { RolePortfolioProps } from './shared/contracts.ts';
import '../editor/portfolio-fonts.css';
import { BackendPortfolio } from './backend/BackendPortfolio.tsx';
import { SecurityPortfolio } from './security/SecurityPortfolio.tsx';

export function RoleTemplatePreview(props: RolePortfolioProps) {
  if(props.document.themeConfig.layout==='backend')return <BackendPortfolio {...props} />;
  if(props.document.themeConfig.layout==='security')return <SecurityPortfolio {...props} />;
  return null;
}
