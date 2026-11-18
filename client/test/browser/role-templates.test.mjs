import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { before,after,test } from 'node:test';
import { BUILTIN_TEMPLATES,isRoleLayout } from '../../../packages/shared/dist/index.js';
import { generateStaticSite } from '../../../server/dist/generators/static.generator.js';
import { projectFixtureData,projectsFixture } from './helpers/projects.mjs';
const {chromium}=await import(process.env.GITFOLIO_PLAYWRIGHT_MODULE??'playwright');
const templates=BUILTIN_TEMPLATES.filter((template)=>isRoleLayout(template.defaultConfig.theme.layout));
let browser;before(async()=>{browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined});});after(async()=>{await browser?.close();});
function projectFor(template){const project={...projectFixtureData('Role portfolio'),templateId:template.id,template,themeConfig:structuredClone(template.defaultConfig.theme),sections:template.defaultConfig.sections.map((section,sortOrder)=>({...structuredClone(section),id:randomUUID(),sortOrder}))};project.sectionCount=project.sections.length;return project;}
async function exercise(page,role){
  if(role==='backend'){
    await page.getByRole('button',{name:/Job visibility/}).click();await page.getByRole('button',{name:'Response JSON',exact:true}).click();
    assert.ok((await page.locator('[data-widget="api"] pre').textContent()).includes('completed'));
    await page.getByRole('button',{name:/Idempotent writes/}).click();assert.ok((await page.locator('[data-widget="api"] pre').textContent()).includes('IDEMPOTENCY_CONFLICT'));
  }
  if(role==='security'){
    await page.getByRole('searchbox',{name:'Search security findings',exact:true}).fill('dependency');
    await page.getByRole('button',{name:/Open finding LAB-2026-001/}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(),0);
  }
  if(role==='quality'){
    await page.getByRole('button',{name:'Coral palette',exact:true}).click();await page.getByRole('button',{name:'Serif typography',exact:true}).click();
    assert.equal(await page.locator('[data-widget="tokens"]').getAttribute('data-tone'),'coral');
  }
  if(role==='frontend'){
    await page.getByRole('button',{name:'Error state',exact:true}).click();await page.getByText('We couldn’t save this change.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Success state',exact:true}).click();await page.getByText('Saved. You’re all set.',{exact:true}).waitFor();
  }
  if(role==='fullstack'){
    await page.getByRole('button',{name:/^Upgrade subscription\b/}).click();
    assert.ok((await page.locator('[data-widget="flow"]').textContent()).includes('UPDATE organizations'));
    const invite=page.getByRole('button',{name:/^Invite teammate\b/});await invite.click();assert.equal(await invite.getAttribute('aria-pressed'),'true');
    assert.ok((await page.locator('[data-widget="flow"]').textContent()).includes('POST /api/invitations'));
    assert.ok((await page.locator('[data-widget="flow"]').textContent()).includes('INSERT INTO invitations'));
  }
}
for(const template of templates)test(`${template.name}: editor controls, real React interaction, save/reload and responsive preview`,async(t)=>{
  const project=projectFor(template),role=template.defaultConfig.theme.layout;
  const f=await projectsFixture(t,browser,{projects:[project],templates:BUILTIN_TEMPLATES});await f.goto(`/projects/${project.id}/edit`);
  const preview=f.page.getByRole('region',{name:'Portfolio preview',exact:true});await preview.waitFor();assert.equal(await preview.getAttribute('data-role-layout'),role);
  await f.page.getByLabel('Section heading',{exact:true}).fill('Engineering with a clear point of view.');await f.page.getByRole('button',{name:'Save changes',exact:true}).click();await f.page.getByText('All changes saved',{exact:true}).waitFor();await f.page.reload();
  await preview.getByRole('heading',{name:'Engineering with a clear point of view.',exact:true}).waitFor();
  await f.page.getByRole('button',{name:'Preview',exact:true}).click();await exercise(f.page,role);
  for(const width of [1440,768,375,320]){await f.page.setViewportSize({width,height:1000});assert.ok(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await preview.evaluate((node)=>node.scrollWidth<=node.clientWidth+1));}
});
for(const template of templates)test(`${template.name}: static export hydrates with keyboard access and no external demo requests`,async(t)=>{
  const role=template.defaultConfig.theme.layout,files=Object.fromEntries(generateStaticSite(projectFor(template)).map((file)=>[file.path,file.content]));
  const context=await browser.newContext({reducedMotion:'no-preference'});t.after(()=>context.close());const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',(error)=>errors.push(error.message));page.on('console',(message)=>{if(message.type()==='error')errors.push(message.text());});
  await page.route('**/*',(route)=>{const url=new URL(route.request().url());if(!url.pathname.startsWith('/__role-static/')){external.push(url.origin);return route.abort();}const file=url.pathname.split('/').at(-1)||'index.html';return route.fulfill({status:200,contentType:file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html',body:files[file]??''});});
  await page.goto('http://127.0.0.1:4173/__role-static/');await page.locator('[data-role-layout]').waitFor();await page.evaluate(()=>document.fonts.ready);
  for(const width of [1440,768,375,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${role} overflow at ${width}`);if(process.env.GITFOLIO_TEMPLATE_SCREENSHOTS&&[1440,375].includes(width)){mkdirSync(process.env.GITFOLIO_TEMPLATE_SCREENSHOTS,{recursive:true});await page.screenshot({path:join(process.env.GITFOLIO_TEMPLATE_SCREENSHOTS,`role-${role}-${width}.png`),fullPage:true});}}
  if(role==='backend'){await page.setViewportSize({width:1440,height:1000});const inner=await page.locator('.rp-backend-hero').boundingBox(),outer=await page.locator('section[data-section-type="hero"]').boundingBox();assert.ok(inner.width>=outer.width-2,'the blueprint grid fills the hero section');}
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to portfolio content');await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').evaluate((node)=>node.tagName),'MAIN');
  await exercise(page,role);
  if(role==='frontend'){await page.getByRole('button',{name:'Hover state',exact:true}).click();await page.waitForFunction(()=>{const value=getComputedStyle(document.querySelector('.rp-sandbox-card')).transform;return value!=='none'&&new DOMMatrixReadOnly(value).m42 < -4.9;});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>{const node=document.querySelector('.rp-sandbox-card'),value=getComputedStyle(node).transform,matrix=new DOMMatrixReadOnly(value==='none'?undefined:value);return Math.abs(matrix.m42)<.01&&Math.abs(matrix.m11-1)<.01;});await page.getByRole('button',{name:'Loading state',exact:true}).click();await page.getByText('Saved. You’re all set.',{exact:true}).waitFor();}
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});
