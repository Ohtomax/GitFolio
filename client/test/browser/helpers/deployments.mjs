import { randomUUID } from 'node:crypto';
import { DEPLOYMENT_MESSAGES } from '@gitfolio/shared';
import { projectsFixture } from './projects.mjs';

const active = (status) => ['PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING'].includes(status);
export function deploymentFixtureData(project, status = 'PENDING', index = 0) {
  const at = new Date(Date.now() - index * 60000).toISOString(), repo = project.repoName ?? `gitfolio-${project.slug}`;
  const source = ['DEPLOYING', 'LIVE', 'FAILED'].includes(status);
  const codes = status === 'FAILED' ? ['QUEUED', 'BUILDING', 'BUILD_FAILED'] : ['QUEUED', 'BUILDING', 'PUSHING', 'DEPLOYING', 'LIVE'].slice(0, ['PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING', 'LIVE'].indexOf(status) + 1);
  return { id: randomUUID(), projectId: project.id, status, editorRevision: project.editorRevision,
    format: project.template.isReact ? 'react' : 'static', repositoryName: repo,
    repositoryUrl: source ? `https://github.com/fixture-user/${repo}` : null,
    pagesUrl: status === 'LIVE' ? `https://fixture-user.github.io/${repo}/` : null,
    buildUrl: source && project.template.isReact ? `https://github.com/fixture-user/${repo}/actions/runs/123` : null,
    commitSha: source ? 'a'.repeat(40) : null, errorCode: status === 'FAILED' ? 'BUILD_FAILED' : null,
    logs: codes.map(code => ({ at, code, message: DEPLOYMENT_MESSAGES[code] })), startedAt: at, updatedAt: at,
    completedAt: active(status) ? null : at };
}
export function advanceDeployment(deployment, status) {
  deployment.status = status; deployment.updatedAt = new Date().toISOString();
  if (['DEPLOYING', 'LIVE'].includes(status)) {
    deployment.commitSha = 'a'.repeat(40); deployment.repositoryUrl = `https://github.com/fixture-user/${deployment.repositoryName}`;
  }
  if (status === 'LIVE') { deployment.pagesUrl = `https://fixture-user.github.io/${deployment.repositoryName}/`; deployment.completedAt = deployment.updatedAt; }
  const code = status === 'PENDING' ? 'QUEUED' : status === 'FAILED' ? 'BUILD_FAILED' : status;
  deployment.logs.push({ at: deployment.updatedAt, code, message: DEPLOYMENT_MESSAGES[code] });
  if (status === 'FAILED') { deployment.errorCode = 'BUILD_FAILED'; deployment.completedAt = deployment.updatedAt; }
}
export async function deploymentsFixture(t, browser, options = {}) {
  const f = await projectsFixture(t, browser, options);
  Object.assign(f.state, { deployments: options.deployments ?? [], publishAuthorized: options.publishAuthorized ?? true,
    deployRequests: 0, deployCreates: 0, deployBodies: [], statusRequests: 0, historyRequests: 0, authorizationRequests: [] });
  const send = (route, status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const ok = (route, data, status = 200) => send(route, status, { success: true, data });
  const fail = (route, code, status) => send(route, status, { success: false, error: { code, message: 'Fixture failure.' } });
  const projectFor = (route) => f.state.projects.find(project => project.id === new URL(route.request().url()).pathname.split('/')[3]);
  await f.page.route('**/api/projects/*/publish', (route) => {
    if (f.state.failCapability) return fail(route, 'SERVICE_UNAVAILABLE', 503);
    const project = projectFor(route); if (!project) return fail(route, 'PROJECT_NOT_FOUND', 404);
    return ok(route, { format: project.template.isReact ? 'react' : 'static', repositoryName: project.repoName ?? `gitfolio-${project.slug}`,
      requiredScopes: project.template.isReact ? ['repo', 'workflow'] : ['repo'], authorized: f.state.publishAuthorized,
      archived: project.status === 'ARCHIVED', editorRevision: project.editorRevision,
      activeDeploymentId: f.state.deployments.find(item => item.projectId === project.id && active(item.status))?.id ?? null });
  });
  await f.page.route('**/api/projects/*/deployments**', (route) => {
    f.state.historyRequests++;
    if (f.state.failHistory) return fail(route, 'SERVICE_UNAVAILABLE', 503);
    const project = projectFor(route); if (!project) return fail(route, 'PROJECT_NOT_FOUND', 404);
    const url = new URL(route.request().url()), page = Number(url.searchParams.get('page') || 1), pageSize = Number(url.searchParams.get('pageSize') || 6);
    const items = f.state.deployments.filter(item => item.projectId === project.id);
    return ok(route, { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize, totalPages: Math.ceil(items.length / pageSize) });
  });
  await f.page.route('**/api/projects/*/deploy', (route) => {
    f.state.deployRequests++;
    const input = route.request().postDataJSON(); f.state.deployBodies.push(input);
    if (f.state.failDeploy) return fail(route, 'SERVICE_UNAVAILABLE', 503);
    const existing = f.state.deployments.find(item => item.requestId === input.requestId);
    if (existing) return ok(route, existing, 202);
    const project = projectFor(route); if (!project) return fail(route, 'PROJECT_NOT_FOUND', 404);
    if (project.status === 'ARCHIVED') return fail(route, 'PROJECT_ARCHIVED', 409);
    if (!f.state.publishAuthorized) return fail(route, 'GITHUB_PERMISSION_REQUIRED', 403);
    if (f.state.deployments.some(item => item.projectId === project.id && active(item.status))) return fail(route, 'DEPLOYMENT_ACTIVE', 409);
    const deployment = { ...deploymentFixtureData(project), requestId: input.requestId };
    f.state.deployments.unshift(deployment); f.state.deployCreates++;
    if (f.state.loseDeployResponseOnce) { f.state.loseDeployResponseOnce = false; return route.abort('failed'); }
    return ok(route, deployment, 202);
  });
  await f.page.route('**/api/deployments/*/status', (route) => {
    f.state.statusRequests++;
    if (f.state.statusUnauthenticated) { f.state.authenticated = false; return fail(route, 'UNAUTHENTICATED', 401); }
    if (f.state.failStatus) return fail(route, 'SERVICE_UNAVAILABLE', 503);
    const id = new URL(route.request().url()).pathname.split('/')[3], deployment = f.state.deployments.find(item => item.id === id);
    if (!deployment) return fail(route, 'DEPLOYMENT_NOT_FOUND', 404);
    if (deployment.status === 'LIVE') { const project = f.state.projects.find(item => item.id === deployment.projectId); if (project && project.status !== 'ARCHIVED') project.status = 'PUBLISHED'; }
    return ok(route, deployment);
  });
  await f.page.route('**/api/auth/github/publish?**', (route) => {
    f.state.authorizationRequests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Authorization fixture</title><p>GitHub publishing authorization</p>' });
  });
  return f;
}
