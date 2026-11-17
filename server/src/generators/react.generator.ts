import Mustache from 'mustache';
import { ProjectSchema, buildPortfolioTree, mountPortfolioInteractions, type Project } from '@gitfolio/shared';
import packageJson from './react-package.json' with { type: 'json' };
import lockfile from './react-lock.json' with { type: 'json' };
import { validateArtifact, type GeneratedFile } from './artifact.js';
import { portfolioStyles } from './static.generator.js';

const component = `import portfolio from './portfolio.json';
function Link({url,children,className}) {
  let safe=false;
  try { const parsed=new URL(url); safe=['https:','http:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password; } catch {}
  if (/^mailto:[^\\s<>@?]+@[^\\s<>@?]+\\.[^\\s<>@?]+$/.test(url||'')) safe=true;
  return safe ? <a href={url} className={className} target="_blank" rel="noopener noreferrer">{children}</a> : <span className={className}>{children}</span>;
}
export default function App() {
  return <main className="portfolio"><nav className="portfolio-nav" aria-label="Portfolio sections">{portfolio.sections.map(section=><a key={section.id} href={'#section-'+section.id}>{section.content.heading||section.type}</a>)}</nav>
    {portfolio.sections.map(section=>{const content=section.content;return <section key={section.id} id={'section-'+section.id} className={'portfolio-section '+section.type} aria-label={content.heading}>
      {content.eyebrow&&<p className="portfolio-eyebrow">{content.eyebrow}</p>}<h2>{content.heading||section.type}</h2>
      {content.description&&<p className="portfolio-description">{content.description}</p>}
      {content.items?.length>0&&<div className={'portfolio-entries '+(['projects','skills'].includes(section.type)?'portfolio-grid':'')}>{content.items.map((item,index)=><article key={index} className="portfolio-card"><h3><Link url={item.url}>{item.title||'Untitled entry'}</Link></h3>{item.subtitle&&<p className="portfolio-subtitle">{item.subtitle}</p>}{item.description&&<p className="portfolio-description">{item.description}</p>}</article>)}</div>}
      {content.buttonLabel&&<Link url={content.buttonUrl} className="portfolio-action">{content.buttonLabel}</Link>}
    </section>})}
    {!portfolio.sections.length&&<section className="portfolio-section"><h2>{portfolio.name}</h2></section>}
    <footer className="portfolio-footer">{portfolio.name} · {new Date().getFullYear()}</footer></main>;
}
`;
const designedComponent = `import {createElement,useEffect,useRef} from 'react';
import portfolio from './portfolio.json';
const mount = ${mountPortfolioInteractions.toString()};
function Node({node}) {
  if(typeof node==='string') return node;
  const {class:className,tabindex,...attrs}=node.attrs;
  return createElement(node.tag,{...attrs,className,...(tabindex?{tabIndex:Number(tabindex)}:{})},
    ...(node.tag==='input'?[]:node.children.map((child,index)=><Node key={index} node={child}/>)));
}
export default function App(){const root=useRef(null);useEffect(()=>mount(root.current),[]);
  return <div ref={root}><Node node={portfolio.tree}/></div>;
}
`;
export const REACT_PAGES_WORKFLOW = [
  'name: Publish portfolio', 'on:', '  push:', '    branches: [gitfolio]', '  workflow_dispatch:',
  'permissions:', '  contents: read', 'concurrency:', '  group: gitfolio-pages', '  cancel-in-progress: true',
  'jobs:', '  build:', '    runs-on: ubuntu-latest', '    timeout-minutes: 10', '    permissions:', '      contents: read', '      pages: read', '    steps:',
  '      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
  '        with:', '          persist-credentials: false',
  '      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0',
  '        with:', '          node-version: "22"', '          cache: npm',
  '      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0',
  '      - run: npm ci --no-audit --no-fund', '      - run: npm run build',
  '      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0',
  '        with:', '          path: dist', '  deploy:', '    needs: build', '    runs-on: ubuntu-latest',
  '    timeout-minutes: 10', '    permissions:', '      pages: write', '      id-token: write',
  '    environment:', '      name: github-pages', '      url: ${{ steps.deployment.outputs.page_url }}', '    steps:',
  '      - id: deployment', '        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1', '',
].join('\n');
export function generateReactProject(input: Project): GeneratedFile[] {
  const project = ProjectSchema.parse(input);
  const designed = Boolean(project.themeConfig.layout && project.themeConfig.layout !== 'classic');
  const sections = [...project.sections].sort((a, b) => a.sortOrder - b.sortOrder).filter((section) => section.visible).map((section) => ({
    id: section.id, type: section.type, content: { heading: section.content.heading, description: section.content.description,
      ...(section.type === 'hero' ? { eyebrow: section.content.eyebrow } : {}),
      ...(['hero', 'contact'].includes(section.type) ? { buttonLabel: section.content.buttonLabel, buttonUrl: section.content.buttonUrl } : {}),
      ...(['projects', 'skills', 'experience', 'education', 'writing', 'now'].includes(section.type) ? { items: section.content.items } : {}),
      ...(designed ? { subtitle: section.content.subtitle, tags: section.content.tags,
        ...(section.type === 'hero' ? { metrics: section.content.metrics } : {}) } : {}) },
  }));
  return validateArtifact([
    { path: 'package.json', content: JSON.stringify(packageJson, null, 2) + '\n' },
    { path: 'package-lock.json', content: JSON.stringify(lockfile, null, 2) + '\n' },
    { path: 'index.html', content: Mustache.render('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{name}}</title></head><body><div id="root"></div><script type="module" src="./src/main.jsx"></script></body></html>\n', { name: project.name }) },
    { path: 'src/main.jsx', content: "import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport App from './App.jsx';\nimport './style.css';\ncreateRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);\n" },
    { path: 'src/App.jsx', content: designed ? designedComponent : component }, { path: 'src/portfolio.json', content: JSON.stringify({ name: project.name, sections,
      ...(designed ? { tree: buildPortfolioTree({ themeConfig: project.themeConfig, sections: sections.map((section) => ({ ...section, visible: true })) }) } : {}) }, null, 2) + '\n' },
    { path: 'src/style.css', content: portfolioStyles(project.themeConfig) },
    { path: 'vite.config.js', content: "import {defineConfig} from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({plugins:[react()],base:'./'});\n" },
    { path: 'public/.nojekyll', content: '' },
    { path: '.gitignore', content: 'node_modules/\ndist/\n.env\n.env.*\n' },
    { path: '.github/workflows/pages.yml', content: REACT_PAGES_WORKFLOW },
    { path: 'README.md', content: '# Portfolio\n\nGenerated by GitFolio. Use Node.js 22.18 or later, then `npm ci` and `npm run dev`. `npm run build` generates `dist/`.\n\nGitHub Pages uses the included workflow on the gitfolio branch. Content is in src/portfolio.json and styling in src/style.css. Publishing from GitFolio updates these generated files.\n' },
  ]);
}
