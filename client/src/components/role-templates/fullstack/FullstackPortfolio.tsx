import type { RolePortfolioProps } from '../shared/contracts.ts';
import {
  RoleRoot,
  RoleMain,
  RoleNavigation,
  RoleSectionFrame,
  sectionsOf,
  heroOf,
  Intro,
  Action,
  Tags,
  Metrics,
  ItemTitle,
  SupportingSection
} from '../shared/RoleFrame.tsx';
import { ArchitectureFlow } from './ArchitectureFlow.tsx';

export function FullstackPortfolio(props: RolePortfolioProps) {
  const { document } = props;
  const hero = heroOf(document);
  const interactive = Boolean(props.interactive && !props.thumbnail);

  return (
    <RoleRoot {...props}>
      <div className="rp-shell">
        <header className="rp-header">
          <p className="rp-brand">
            {hero?.content.eyebrow}
            <small>SAAS / PRODUCT / SYSTEMS</small>
          </p>
          <RoleNavigation {...props} />
        </header>
      </div>

      <RoleMain className="rp-shell">
        {sectionsOf(document).map((section) => (
          <RoleSectionFrame
            key={section.id}
            {...props}
            section={section}
            className={`rp-fullstack-section rp-fullstack-section-${section.type}`}
          >
            {section.type === 'hero' ? (
              <div className="rp-fullstack-hero">
                <div className="rp-fullstack-hero-main">
                  <p className="rp-kicker">END-TO-END PRODUCT DELIVERY</p>
                  <h1>{section.content.heading}</h1>
                  <p className="rp-subtitle font-mono">{section.content.subtitle}</p>
                  <p className="rp-copy">{section.content.description}</p>
                  <Action section={section} interactive={interactive} />
                  <Tags tags={section.content.tags} />
                </div>
                <aside className="rp-fullstack-hero-bento" aria-label="Key SaaS benchmarks">
                  <div className="rp-bento-header">
                    <span className="rp-tag">SCALE & METRICS</span>
                    <p className="mt-1 font-mono text-[10px] text-[var(--rp-muted)]">
                      Production SaaS Benchmarks
                    </p>
                  </div>
                  <Metrics items={section.content.metrics} />
                  <div className="rp-bento-pill">
                    <span className="rp-dot" aria-hidden="true" />
                    <span>TypeScript UI &rarr; Node API &rarr; PostgreSQL ACID</span>
                  </div>
                </aside>
              </div>
            ) : section.type === 'interactive' ? (
              <>
                <Intro section={section} eyebrow="01 / INTERACTIVE FULL-STACK TRACE" />
                {section.content.widget?.kind === 'flow' && (
                  <ArchitectureFlow data={section.content.widget} interactive={interactive} />
                )}
              </>
            ) : section.type === 'projects' ? (
              <>
                <Intro section={section} eyebrow="02 / SHIPPED PRODUCTS & SAAS" />
                <div className="rp-fullstack-projects">
                  {section.content.items?.map((item, index) => (
                    <article key={index} className="rp-fullstack-card">
                      <div className="rp-fullstack-card-inner">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-[var(--rp-accent)]">
                            PRODUCT / 0{index + 1}
                          </span>
                        </div>
                        <ItemTitle item={item} interactive={interactive} />
                        <p className="rp-copy">{item.description}</p>
                        <Metrics compact items={item.metrics} />
                        <Tags tags={item.tags} />
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : section.type === 'skills' ? (
              <>
                <Intro section={section} eyebrow="03 / THREE-TIER CRAFTSMANSHIP" />
                <div className="rp-fullstack-stack">
                  {section.content.items?.map((item, index) => (
                    <article key={index} className="rp-stack-tier">
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-[var(--rp-accent)]">
                        TIER 0{index + 1}
                      </p>
                      <ItemTitle item={item} interactive={interactive} />
                      <p className="rp-copy">{item.description}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <SupportingSection section={section} interactive={interactive} />
            )}
          </RoleSectionFrame>
        ))}
      </RoleMain>
    </RoleRoot>
  );
}
