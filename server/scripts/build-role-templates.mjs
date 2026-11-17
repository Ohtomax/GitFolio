import { createRequire } from 'node:module';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const clientRequire = createRequire(join(root,'client/package.json'));
const { build } = clientRequire('esbuild');
const postcss = clientRequire('postcss'), tailwind = clientRequire('tailwindcss'), autoprefixer = clientRequire('autoprefixer');
const sourceRoot = join(root,'client/src/components/role-templates');
const sources = {};
async function visit(directory) {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const path = join(directory,entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (/\.(tsx?|css)$/.test(entry.name)) sources[relative(sourceRoot,path).replaceAll('\\','/')] = await readFile(path,'utf8');
  }
}
await visit(sourceRoot);
sources['shared/contracts.ts'] = await readFile(join(root,'packages/shared/src/portfolio/role-contracts.ts'),'utf8');
sources['RoleTemplatePreview.tsx'] = sources['RoleTemplatePreview.tsx'].replace("import '../editor/portfolio-fonts.css';",'');
const alias = { react:dirname(clientRequire.resolve('react/package.json')), 'react-dom':dirname(clientRequire.resolve('react-dom/package.json')) };
const common = { absWorkingDir:sourceRoot, bundle:true, write:false, jsx:'automatic', loader:{'.css':'empty'}, alias, logLevel:'silent' };
const browser = await build({ ...common, platform:'browser', format:'iife', minify:true, target:['es2022'], define:{'process.env.NODE_ENV':'"production"'},
  stdin:{ resolveDir:sourceRoot, loader:'tsx', contents:"import React from 'react';import {hydrateRoot} from 'react-dom/client';import {RoleTemplatePreview} from './RoleTemplatePreview.tsx';const root=document.getElementById('portfolio-root');const data=document.getElementById('portfolio-data');if(root&&data)hydrateRoot(root,React.createElement(RoleTemplatePreview,{document:JSON.parse(data.textContent||'{}'),interactive:true}));" } });
const runtime = await build({ ...common, platform:'node', format:'esm', target:['node22'], define:{'process.env.NODE_ENV':'"production"'},
  banner:{js:"import {createRequire as roleCreateRequire} from 'node:module';const require=roleCreateRequire(import.meta.url);"},
  stdin:{ resolveDir:sourceRoot, loader:'tsx', contents:"import React from 'react';import {renderToString} from 'react-dom/server';import {RoleTemplatePreview} from './RoleTemplatePreview.tsx';export function renderRolePortfolio(document){return renderToString(React.createElement(RoleTemplatePreview,{document,interactive:true}));}" } });
const css = await postcss([tailwind({ content:[{raw:Object.values(sources).join('\n'),extension:'tsx'}],theme:{extend:{}},plugins:[] }),autoprefixer])
  .process('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n'+sources['shared/roles.css'],{from:undefined});
const destination = join(root,'server/dist/generators');
await mkdir(destination,{recursive:true});
await writeFile(join(destination,'role-runtime.js'),runtime.outputFiles[0].text);
await writeFile(join(root,'server/src/generators/role-sources.json'),JSON.stringify({sources,css:css.css,script:browser.outputFiles[0].text})+'\n');
process.stdout.write(`Prepared ${Object.keys(sources).length} portable role-template source files and shared React exports.\n`);
