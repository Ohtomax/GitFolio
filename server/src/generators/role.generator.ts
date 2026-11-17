import Mustache from 'mustache';
import { type Project, type RoleDocument } from '@gitfolio/shared';
import roleSources from './role-sources.json' with { type: 'json' };
import packageJson from './role-react-package.json' with { type: 'json' };
import lockfile from './role-react-lock.json' with { type: 'json' };
import { renderRolePortfolio } from './role-runtime.js';
import { portfolioFontStyles } from './portfolio-fonts.js';
import { validateArtifact, type GeneratedFile } from './artifact.js';

export const ROLE_ARTIFACT_PATHS = ['src/main.tsx','tsconfig.json','tailwind.config.js','postcss.config.js',
  ...Object.keys(roleSources.sources).map((path) => `src/roles/${path}`)];
function publicDocument(project: Project): RoleDocument {
  return { name: project.name, themeConfig: project.themeConfig, sections: [...project.sections].sort((a,b) => a.sortOrder-b.sortOrder).filter((section) => section.visible)
    .map((section) => ({ id:section.id,type:section.type,visible:true,content:{heading:section.content.heading,description:section.content.description,
      subtitle:section.content.subtitle,tags:section.content.tags,
      ...(section.type === 'hero' ? {eyebrow:section.content.eyebrow,metrics:section.content.metrics} : {}),
      ...(['hero','contact'].includes(section.type) ? {buttonLabel:section.content.buttonLabel,buttonUrl:section.content.buttonUrl} : {}),
      ...(['projects','skills','experience','education','writing','now','contact'].includes(section.type) ? {items:section.content.items} : {}),
      ...(section.type === 'interactive' ? {widget:section.content.widget} : {})} })) };
}
const bodyStyles = (project: Project) => `body{margin:0;background:${project.themeConfig.colors.background};color:${project.themeConfig.colors.text}}`;
export function generateRoleStaticSite(project: Project): GeneratedFile[] {
  const document = publicDocument(project);
  const data = JSON.stringify(document).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  const html = Mustache.render('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{name}}</title><link rel="stylesheet" href="./style.css"><script src="./script.js" defer></script></head><body><div id="portfolio-root">{{{markup}}}</div><script type="application/json" id="portfolio-data">{{{data}}}</script></body></html>\n',
    { name:project.name, markup:renderRolePortfolio(document), data });
  // React escapes all visible strings. JSON uses escaped '<' so content cannot
  // terminate its non-executable data element. No user HTML is interpolated.
  return validateArtifact([{path:'index.html',content:html},{path:'style.css',content:portfolioFontStyles(project.themeConfig)+bodyStyles(project)+roleSources.css},
    {path:'script.js',content:roleSources.script},{path:'.nojekyll',content:''}]);
}
export function generateRoleReactProject(project: Project, workflow: string): GeneratedFile[] {
  return validateArtifact([
    {path:'package.json',content:JSON.stringify(packageJson,null,2)+'\n'}, {path:'package-lock.json',content:JSON.stringify(lockfile,null,2)+'\n'},
    {path:'index.html',content:Mustache.render('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{name}}</title></head><body><div id="root"></div><script type="module" src="./src/main.tsx"></script></body></html>',{name:project.name})},
    {path:'src/main.tsx',content:"import React from 'react';import {createRoot} from 'react-dom/client';import {RoleTemplatePreview} from './roles/RoleTemplatePreview.tsx';import type {RoleDocument} from './roles/shared/contracts.ts';import portfolio from './portfolio.json';import './style.css';createRoot(document.getElementById('root')!).render(<React.StrictMode><RoleTemplatePreview document={portfolio as RoleDocument} interactive /></React.StrictMode>);\n"},
    {path:'src/portfolio.json',content:JSON.stringify(publicDocument(project),null,2)+'\n'},
    {path:'src/style.css',content:portfolioFontStyles(project.themeConfig)+'\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n'+bodyStyles(project)},
    ...Object.entries(roleSources.sources).map(([path,content]) => ({path:`src/roles/${path}`,content})),
    {path:'tsconfig.json',content:JSON.stringify({compilerOptions:{target:'ES2022',lib:['ES2022','DOM','DOM.Iterable'],module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,noEmit:true,skipLibCheck:true,resolveJsonModule:true,allowImportingTsExtensions:true,esModuleInterop:true},include:['src']},null,2)},
    {path:'tailwind.config.js',content:"export default {content:['./index.html','./src/**/*.{ts,tsx}'],theme:{extend:{}},plugins:[]};\n"},
    {path:'postcss.config.js',content:"export default {plugins:{tailwindcss:{},autoprefixer:{}}};\n"},
    {path:'vite.config.js',content:"import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()],base:'./'});\n"},
    {path:'public/.nojekyll',content:''},{path:'.gitignore',content:'node_modules/\ndist/\n.env\n.env.*\n'},
    {path:'.github/workflows/pages.yml',content:workflow},
    {path:'README.md',content:'# Role portfolio\n\nUse Node.js 22.18+, run `npm ci`, then `npm run dev`. `npm run build` checks TypeScript and builds the site. Content and editable demo data are in src/portfolio.json. Layouts and interactive widgets are portable TSX in src/roles. Tailwind and scoped container rules support mobile, tablet, and desktop.\n\nExamples are labeled simulations. Replace the sample profile, project links, organizations, and metrics before removing the illustrative-content label. The widgets make no external API requests and never execute displayed commands or SQL. GitFolio publishing regenerates these files.\n'},
  ]);
}
