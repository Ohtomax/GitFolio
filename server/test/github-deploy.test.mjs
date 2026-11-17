import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createGitHubDeploymentProvider } from '../dist/providers/github-deploy.js';

const A = 'a'.repeat(40), B = 'b'.repeat(40), C = 'c'.repeat(40), D = 'd'.repeat(40);
function fixture() {
  const projectId = randomUUID(), deploymentId = randomUUID(), calls = [];
  const user = { id: 123, login: 'fixture-user' };
  const state = { repo: null, marker: null, head: A, pages: null, builds: [], status: 'building', failRef: false, checks: 0 };
  let newMarker;
  const request = async (route, input) => {
    calls.push({ route, input });
    const missing = () => { throw { status: 404 }; };
    switch (route) {
      case 'GET /user': return user;
      case 'GET /repos/{owner}/{repo}': return state.repo ?? missing();
      case 'POST /user/repos': return state.repo = { id: 456, name: input.name, description: input.description,
        owner: user, default_branch: 'main', private: false, archived: false, permissions: { admin: true } };
      case 'PATCH /repos/{owner}/{repo}': state.repo.default_branch = input.default_branch; return state.repo;
      case 'GET /repos/{owner}/{repo}/contents/{path}': return state.marker ? { type: 'file', encoding: 'base64', content: Buffer.from(JSON.stringify(state.marker)).toString('base64') } : missing();
      case 'GET /repos/{owner}/{repo}/git/ref/{ref}':
        if (input.ref === 'heads/gitfolio' && state.repo.default_branch !== 'gitfolio') return missing();
        return { object: { sha: state.head } };
      case 'GET /repos/{owner}/{repo}/git/commits/{commit_sha}': return { sha: state.head, tree: { sha: B }, message: state.marker ? `GitFolio deploy ${state.marker.deploymentId}` : 'Initial commit' };
      case 'GET /repos/{owner}/{repo}/git/trees/{tree_sha}': return { truncated: false, tree: [{ path: 'README.md' }] };
      case 'POST /repos/{owner}/{repo}/git/refs': return {};
      case 'POST /repos/{owner}/{repo}/git/trees': newMarker = JSON.parse(input.tree.find(file => file.path === '.gitfolio.json').content); return { sha: C };
      case 'POST /repos/{owner}/{repo}/git/commits': return { sha: D };
      case 'PATCH /repos/{owner}/{repo}/git/refs/{ref}':
        assert.equal(input.force, false); if (state.failRef) throw { status: 422, message: 'private-provider-data' };
        state.head = input.sha; state.marker = newMarker; return {};
      case 'GET /repos/{owner}/{repo}/pages': return state.pages ?? missing();
      case 'POST /repos/{owner}/{repo}/pages': case 'PUT /repos/{owner}/{repo}/pages':
        return state.pages = { html_url: 'https://fixture-user.github.io/portfolio/', cname: null, ...input };
      case 'POST /repos/{owner}/{repo}/pages/builds': return {};
      case 'GET /repos/{owner}/{repo}/pages/builds/latest': return { commit: state.head, status: state.status };
      case 'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs': assert.equal(input.event, 'workflow_dispatch'); return { workflow_runs: state.builds };
      case 'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches': return {};
      default: throw new Error('Unexpected route: ' + route);
    }
  };
  const provider = createGitHubDeploymentProvider('fixture-token-never-log', request, async () => { state.checks++; });
  return { projectId, deploymentId, calls, user, state, provider };
}
test('GitHub provider creates a public owned repository, commits a tree without force, and verifies the exact build', async () => {
  const f = fixture();
  const context = await f.provider.prepare('123', 'portfolio', f.projectId);
  const source = await f.provider.publish(context, f.deploymentId, [{ path: 'index.html', content: '<h1>Portfolio</h1>' }], 'static');
  assert.equal(source.commitSha, D); assert.ok(f.state.checks > 0);
  const tree = f.calls.find(call => call.route.endsWith('/git/trees') && call.route.startsWith('POST')).input;
  assert.equal(tree.base_tree, B); assert.ok(!tree.tree.some(file => file.path === 'README.md' && file.sha === null));
  assert.equal((await f.provider.check(source)).status, 'pending');
  f.state.status = 'built'; assert.equal((await f.provider.check(source)).pagesUrl, 'https://fixture-user.github.io/portfolio/');
  const resumed = await f.provider.prepare('123', 'portfolio', f.projectId);
  await f.provider.publish(resumed, f.deploymentId, [{ path: 'index.html', content: '<h1>Portfolio</h1>' }], 'static');
  assert.equal(f.calls.filter(call => call.route === 'POST /repos/{owner}/{repo}/git/commits').length, 1);
});
test('unmanaged, foreign-account, private, and other-project repositories are rejected before writes', async () => {
  for (const mode of ['unmanaged', 'private', 'other-project', 'wrong-account']) {
    const f = fixture();
    await f.provider.prepare('123', 'portfolio', f.projectId);
    f.calls.length = 0;
    if (mode === 'wrong-account') f.user.id = 999;
    else if (mode === 'private') f.state.repo.private = true;
    else if (mode === 'other-project') f.state.marker = { version: 1, projectId: randomUUID(), deploymentId: randomUUID(), format: 'static', files: [] };
    else f.state.repo.description = 'An unrelated project';
    await assert.rejects(f.provider.prepare('123', 'portfolio', f.projectId), { code: mode === 'wrong-account' ? 'GITHUB_ACCOUNT_MISMATCH' : 'GITHUB_REPO_CONFLICT' });
    assert.equal(f.calls.filter(call => !call.route.startsWith('GET ')).length, 0);
  }
});
test('a ref conflict preserves the branch and does not change Pages settings or expose provider errors', async () => {
  const f = fixture(), context = await f.provider.prepare('123', 'portfolio', f.projectId);
  f.state.failRef = true;
  await assert.rejects(f.provider.publish(context, f.deploymentId, [{ path: 'index.html', content: 'New' }], 'static'), error => error.code === 'GITHUB_WRITE_CONFLICT' && !error.message.includes('private-provider'));
  assert.equal(f.state.head, A); assert.equal(f.state.pages, null);
});
test('React publishing waits for the matching dispatched workflow and successful Pages deployment', async () => {
  const f = fixture(), context = await f.provider.prepare('123', 'portfolio', f.projectId);
  const source = await f.provider.publish(context, f.deploymentId, [{ path: 'index.html', content: 'React' }], 'react');
  assert.equal((await f.provider.check(source)).status, 'pending');
  assert.ok(f.calls.some(call => call.route.endsWith('/dispatches')));
  f.state.builds = [{ id: 1, head_sha: D, status: 'completed', conclusion: 'failure', html_url: 'https://github.com/fixture-user/portfolio/actions/runs/1' }];
  assert.equal((await f.provider.check(source)).status, 'failed');
  f.state.builds[0].conclusion = 'success'; assert.equal((await f.provider.check(source)).status, 'live');
  f.state.head = A; await assert.rejects(f.provider.check(source), { code: 'GITHUB_REPO_CONFLICT' });
});
