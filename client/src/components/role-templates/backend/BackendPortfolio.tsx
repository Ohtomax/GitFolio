import type { RolePortfolioProps } from '../shared/contracts.ts';
import { RoleRoot, RoleMain, RoleNavigation, RoleSectionFrame, sectionsOf, heroOf, Intro, Action, Tags, Metrics, ItemTitle, SupportingSection } from '../shared/RoleFrame.tsx';
import { ApiPlayground } from './ApiPlayground.tsx';

export function BackendPortfolio(props: RolePortfolioProps) {
  const {document}=props, hero=heroOf(document), interactive=Boolean(props.interactive&&!props.thumbnail);
  return <RoleRoot {...props}><div className="rp-shell"><header className="rp-header"><p className="rp-brand">{hero?.content.eyebrow}<small>SYSTEMS / PLATFORM / DATA</small></p><RoleNavigation {...props} /></header></div>
    <RoleMain className="rp-shell">{sectionsOf(document).map((section) => <RoleSectionFrame key={section.id} {...props} section={section} className={`rp-backend-section rp-backend-section-${section.type}`}>
      {section.type==='hero'?<div className="rp-backend-hero"><div><p className="rp-kicker">Contracts first. Failure considered.</p><h1>{section.content.heading}</h1><p className="rp-subtitle font-mono">{section.content.subtitle}</p><p className="rp-copy">{section.content.description}</p><Action section={section} interactive={interactive} /><Metrics items={section.content.metrics} /></div><aside className="rp-blueprint" aria-label="Illustrative ingestion architecture"><p className="font-mono text-[10px] uppercase tracking-widest text-[var(--rp-accent)]">Architecture sketch / Ingestion path</p><ol className="rp-pipeline">{['API gateway','Validation & idempotency','Kafka / event log','PostgreSQL / materialized state'].map((step,i) => <li key={step}><span className="font-mono text-[10px] text-[var(--rp-accent)]">0{i+1}</span><span>{step}</span></li>)}</ol><Tags tags={section.content.tags} /></aside></div>
      :section.type==='interactive'?<><Intro section={section} eyebrow="01 / Inspect the boundary" />{section.content.widget?.kind==='api'&&<ApiPlayground data={section.content.widget} interactive={interactive} />}</>
      :section.type==='projects'?<><Intro section={section} eyebrow="02 / Selected systems" /><div className="rp-backend-projects">{section.content.items?.map((item,i) => <article key={i} className="rp-system-row"><span className="font-mono text-xs text-[var(--rp-accent)]">SYS / 0{i+1}</span><div><ItemTitle item={item} interactive={interactive} /><p className="rp-copy">{item.description}</p><Tags tags={item.tags} /></div><Metrics items={item.metrics} compact /></article>)}</div></>
      :section.type==='skills'?<><Intro section={section} eyebrow="03 / Infrastructure inventory" /><div className="rp-infra-grid">{section.content.items?.map((item,i) => <article key={i}><p className="mb-4 font-mono text-[10px] text-[var(--rp-accent)]">LAYER / 0{i+1}</p><ItemTitle item={item} interactive={interactive} /><p className="rp-copy">{item.description}</p></article>)}</div></>
      :<SupportingSection section={section} interactive={interactive} />}
    </RoleSectionFrame>)}</RoleMain>
  </RoleRoot>;
}
