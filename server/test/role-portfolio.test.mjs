import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { BUILTIN_TEMPLATES, isRoleLayout, RoleWidgetSchema, SaveEditorSchema, contrastRatio } from '@gitfolio/shared';
import { generateStaticSite } from '../dist/generators/static.generator.js';
import { generateReactProject } from '../dist/generators/react.generator.js';
import { generatorProject } from './helpers/portfolio.mjs';

for (const template of BUILTIN_TEMPLATES.filter((item) => isRoleLayout(item.defaultConfig.theme.layout))) test(`${template.name}: typed React, hydrated static output, safe editable data and preset contrast`, () => {
  const project={...generatorProject(),templateId:template.id,template,themeConfig:template.defaultConfig.theme,
    sections:template.defaultConfig.sections.map((section,sortOrder)=>({...structuredClone(section),id:randomUUID(),sortOrder}))};
  project.sectionCount=project.sections.length;
  for(const field of ['text','muted','accent','primary','success','warning','danger'])for(const background of ['background','surface'])assert.ok(contrastRatio(project.themeConfig.colors[field],project.themeConfig.colors[background])>=4.5,`${field}/${background}`);
  const widget=project.sections.find((section)=>section.type==='interactive').content.widget;
  RoleWidgetSchema.parse(widget);
  const files=generateReactProject(project),react=Object.fromEntries(files.map((file)=>[file.path,file.content]));
  assert.ok(files.length<=30);
  assert.match(react['src/main.tsx'],/RoleTemplatePreview/);
  assert.equal(JSON.parse(react['tsconfig.json']).compilerOptions.strict,true);
  assert.deepEqual(JSON.parse(react['src/portfolio.json']).sections.find((section)=>section.type==='interactive').content.widget,widget);
  assert.ok(!react['src/roles/RoleTemplatePreview.tsx'].includes('@gitfolio/shared'));
  assert.ok(!Object.values(react).some((value)=>value.includes('dangerouslySetInnerHTML')));
  const html=generateStaticSite(project).find((file)=>file.path==='index.html').content;
  assert.match(html,/data-role-layout=/);assert.match(html,/type="application\/json"/);
  project.sections[0].content.heading='</script><img src=x onerror=alert(1)>';
  const escaped=generateStaticSite(project)[0].content;
  assert.ok(!escaped.includes('<img src=x'));assert.ok(escaped.includes('\\u003c/script>'));
  project.sections[1].visible=false;project.sections[1].content.description='PRIVATE_HIDDEN_WIDGET';
  assert.ok(!JSON.stringify(generateReactProject(project)).includes('PRIVATE_HIDDEN_WIDGET'));
  assert.ok(!JSON.stringify(generateStaticSite(project)).includes('PRIVATE_HIDDEN_WIDGET'));
  const input={baseRevision:0,themeConfig:project.themeConfig,sections:project.sections.map(({sortOrder,...section})=>section)};
  SaveEditorSchema.parse(input);
  input.sections.find((section)=>section.type==='interactive').content.widget={...widget,execute:true};
  assert.equal(SaveEditorSchema.safeParse(input).success,false);
});
