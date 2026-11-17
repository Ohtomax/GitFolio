import { Octokit } from '@octokit/rest';
import { z } from 'zod';
import { RepoNameSchema } from '@gitfolio/shared';
import { validateArtifact, type GeneratedFile } from '../generators/artifact.js';
import { ServiceError } from '../utils/service-error.js';

const sha = z.string().regex(/^[a-f0-9]{40}$/);
const login = z.string().regex(/^[a-zA-Z0-9-]{1,39}$/);
const identity = z.object({ id: z.number().int().positive().safe(), login });
const repository = z.object({ id: z.number().int().positive().safe(), name: RepoNameSchema, owner: identity,
  private: z.boolean(), archived: z.boolean(), default_branch: z.string().min(1).max(255), description: z.string().nullable(),
  permissions: z.object({ admin: z.boolean() }).optional() });
const refSchema = z.object({ object: z.object({ sha }) });
const commitSchema = z.object({ sha, message: z.string(), tree: z.object({ sha }) });
const allowedPaths = new Set(['index.html', 'style.css', 'script.js', '.nojekyll', 'package.json', 'package-lock.json',
  'src/main.jsx', 'src/App.jsx', 'src/portfolio.json', 'src/style.css', 'vite.config.js', 'public/.nojekyll', '.gitignore',
  '.github/workflows/pages.yml', 'README.md']);
const manifestSchema = z.object({ version: z.literal(1), projectId: z.string().uuid(), deploymentId: z.string().uuid(),
  format: z.enum(['static', 'react']), files: z.array(z.string().refine((path) => allowedPaths.has(path))).max(30) }).strict();
type Manifest = z.infer<typeof manifestSchema>;
export interface PublishContext { owner: string; repo: string; repositoryId: string; projectId: string;
  baseSha: string; baseTree: string; message: string; manifest: Manifest | null }
export interface PublishedSource { owner: string; repo: string; repositoryId: string; commitSha: string;
  repositoryUrl: string; format: 'static' | 'react' }
export type GitHubRequest = (route: string, parameters: Record<string, unknown>) => Promise<unknown>;
const conflict = () => new ServiceError(409, 'GITHUB_REPO_CONFLICT', 'Choose a new repository name or restore the GitFolio-managed repository and branch.');

export function createGitHubDeploymentProvider(token: string, transport?: GitHubRequest, assertActive = async () => {}) {
  const fetcher: typeof fetch = (input, init) => fetch(input, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
  const octokit = new Octokit({ auth: token, userAgent: 'GitFolio', request: { fetch: fetcher },
    log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} } });
  const raw: GitHubRequest = transport ?? (async (route, parameters) => (await octokit.request(route, parameters)).data);
  async function request(route: string, parameters: Record<string, unknown> = {}): Promise<unknown> {
    try {
      if (!route.startsWith('GET ')) await assertActive();
      return await raw(route, { ...parameters, headers: { 'X-GitHub-Api-Version': '2022-11-28' } });
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
      const headers = z.object({ response: z.object({ headers: z.record(z.unknown()) }) }).safeParse(error);
      if (status === 429 || status === 403 && headers.success && (headers.data.response.headers['x-ratelimit-remaining'] === '0' || headers.data.response.headers['retry-after'])) {
        throw new ServiceError(429, 'GITHUB_RATE_LIMITED', 'GitHub is limiting publishing requests. Wait before trying again.');
      }
      if (status === 404) throw new ServiceError(404, 'GITHUB_NOT_FOUND', 'GitHub could not find the repository or build.');
      if (status === 401 || status === 403) throw new ServiceError(403, 'GITHUB_PERMISSION_REQUIRED', 'Authorize GitHub publishing access, then try again.');
      if (status === 409 || status === 422) throw new ServiceError(409, 'GITHUB_WRITE_CONFLICT', 'The repository changed or GitHub is still preparing it. Try publishing again.');
      throw new ServiceError(502, 'GITHUB_UNAVAILABLE', 'GitHub is unavailable. Try publishing again later.');
    }
  }
  async function optional(route: string, parameters: Record<string, unknown>) {
    try { return await request(route, parameters); }
    catch (error) { if (error instanceof ServiceError && error.code === 'GITHUB_NOT_FOUND') return null; throw error; }
  }
  async function manifest(owner: string, repo: string): Promise<Manifest | null> {
    const data = await optional('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path: '.gitfolio.json', ref: 'gitfolio' });
    if (data === null) return null;
    try {
      const file = z.object({ type: z.literal('file'), encoding: z.literal('base64'), content: z.string().max(32768) }).parse(data);
      return manifestSchema.parse(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')));
    } catch { throw conflict(); }
  }
  async function head(owner: string, repo: string, branch = 'gitfolio') {
    const ref = refSchema.parse(await request('GET /repos/{owner}/{repo}/git/ref/{ref}', { owner, repo, ref: `heads/${branch}` }));
    return commitSchema.parse(await request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', { owner, repo, commit_sha: ref.object.sha }));
  }
  async function enablePages(owner: string, repo: string, format: 'static' | 'react') {
    const current = await optional('GET /repos/{owner}/{repo}/pages', { owner, repo });
    if (current !== null && z.object({ cname: z.string().nullable().optional() }).parse(current).cname) throw conflict();
    const settings = format === 'react' ? { build_type: 'workflow' } : { build_type: 'legacy', source: { branch: 'gitfolio', path: '/' } };
    await request(`${current === null ? 'POST' : 'PUT'} /repos/{owner}/{repo}/pages`, { owner, repo, ...settings });
  }
  async function runs(source: PublishedSource) {
    const data = z.object({ workflow_runs: z.array(z.object({ head_sha: sha, status: z.string(), conclusion: z.string().nullable(),
      html_url: z.string().url(), id: z.number().int().positive() })).max(100) }).parse(await request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
      owner: source.owner, repo: source.repo, workflow_id: 'pages.yml', branch: 'gitfolio', event: 'workflow_dispatch', head_sha: source.commitSha, per_page: 10,
    }));
    return data.workflow_runs.filter((run) => run.head_sha === source.commitSha);
  }
  return {
    async prepare(expectedGithubId: string, repoName: string, projectId: string): Promise<PublishContext> {
      z.string().uuid().parse(projectId); RepoNameSchema.parse(repoName);
      const user = identity.parse(await request('GET /user'));
      if (String(user.id) !== expectedGithubId) throw new ServiceError(403, 'GITHUB_ACCOUNT_MISMATCH', 'Sign in with the GitHub account that owns this project.');
      const owner = user.login, description = `GitFolio project ${projectId}`;
      let data = await optional('GET /repos/{owner}/{repo}', { owner, repo: repoName });
      if (data === null) {
        try { data = await request('POST /user/repos', { name: repoName, description, private: false, auto_init: true }); }
        catch (error) {
          if (!(error instanceof ServiceError) || error.code !== 'GITHUB_WRITE_CONFLICT') throw error;
          data = await request('GET /repos/{owner}/{repo}', { owner, repo: repoName });
        }
      }
      const saved = repository.parse(data), repo = saved.name;
      if (String(saved.owner.id) !== expectedGithubId || saved.private || saved.archived || saved.permissions?.admin !== true) throw conflict();
      const pages = await optional('GET /repos/{owner}/{repo}/pages', { owner, repo });
      if (pages !== null && z.object({ cname: z.string().nullable().optional() }).parse(pages).cname) throw conflict();
      const marker = await manifest(owner, repo);
      if (marker && marker.projectId !== projectId) throw conflict();
      let latest;
      if (!marker) {
        if (saved.description !== description) throw conflict();
        const initial = await head(owner, repo, saved.default_branch);
        const tree = z.object({ truncated: z.boolean(), tree: z.array(z.object({ path: z.string() })) }).parse(await request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', { owner, repo, tree_sha: initial.tree.sha, recursive: '1' }));
        if (tree.truncated || tree.tree.some((file) => file.path !== 'README.md')) throw conflict();
        const existing = await optional('GET /repos/{owner}/{repo}/git/ref/{ref}', { owner, repo, ref: 'heads/gitfolio' });
        if (existing !== null && refSchema.parse(existing).object.sha !== initial.sha) throw conflict();
        if (existing === null) await request('POST /repos/{owner}/{repo}/git/refs', { owner, repo, ref: 'refs/heads/gitfolio', sha: initial.sha });
        if (saved.default_branch !== 'gitfolio') await request('PATCH /repos/{owner}/{repo}', { owner, repo, default_branch: 'gitfolio' });
        latest = initial;
      } else {
        if (saved.default_branch !== 'gitfolio') throw conflict();
        latest = await head(owner, repo);
      }
      return { owner, repo, repositoryId: String(saved.id), projectId, baseSha: latest.sha, baseTree: latest.tree.sha, message: latest.message, manifest: marker };
    },
    async publish(context: PublishContext, deploymentId: string, files: GeneratedFile[], format: 'static' | 'react'): Promise<PublishedSource> {
      z.string().uuid().parse(deploymentId); validateArtifact(files);
      if (files.some((file) => !allowedPaths.has(file.path))) throw conflict();
      const { owner, repo } = context;
      const result = (commitSha: string): PublishedSource => ({ owner, repo, repositoryId: context.repositoryId, commitSha,
        repositoryUrl: `https://github.com/${owner}/${repo}`, format });
      if (context.manifest?.deploymentId === deploymentId) {
        if (context.message !== `GitFolio deploy ${deploymentId}`) throw conflict();
        await enablePages(owner, repo, format); return result(context.baseSha);
      }
      const marker: Manifest = { version: 1, projectId: context.projectId, deploymentId, format, files: files.map((file) => file.path) };
      const tree: { path: string; mode: '100644'; type: 'blob'; content?: string; sha?: null }[] = files.map((file) => ({ path: file.path, mode: '100644', type: 'blob', content: file.content }));
      tree.push({ path: '.gitfolio.json', mode: '100644', type: 'blob', content: JSON.stringify(marker) });
      for (const path of context.manifest?.files ?? []) if (!files.some((file) => file.path === path)) tree.push({ path, mode: '100644', type: 'blob', sha: null });
      const createdTree = z.object({ sha }).parse(await request('POST /repos/{owner}/{repo}/git/trees', { owner, repo, base_tree: context.baseTree, tree }));
      const commit = z.object({ sha }).parse(await request('POST /repos/{owner}/{repo}/git/commits', { owner, repo,
        message: `GitFolio deploy ${deploymentId}`, tree: createdTree.sha, parents: [context.baseSha] }));
      await request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', { owner, repo, ref: 'heads/gitfolio', sha: commit.sha, force: false });
      await enablePages(owner, repo, format);
      if (format === 'static') {
        try { await request('POST /repos/{owner}/{repo}/pages/builds', { owner, repo }); }
        catch (error) { if (!(error instanceof ServiceError) || !['GITHUB_WRITE_CONFLICT', 'GITHUB_NOT_FOUND'].includes(error.code)) throw error; }
      }
      return result(commit.sha);
    },
    async check(source: PublishedSource): Promise<{ status: 'pending' | 'live' | 'failed'; pagesUrl?: string; buildUrl?: string }> {
      const current = refSchema.parse(await request('GET /repos/{owner}/{repo}/git/ref/{ref}', { owner: source.owner, repo: source.repo, ref: 'heads/gitfolio' }));
      if (current.object.sha !== source.commitSha) throw conflict();
      const pages = z.object({ html_url: z.string().url(), cname: z.string().nullable().optional() }).parse(await request('GET /repos/{owner}/{repo}/pages', { owner: source.owner, repo: source.repo }));
      const url = new URL(pages.html_url);
      const expectedPath = source.repo.toLowerCase() === `${source.owner.toLowerCase()}.github.io` ? '/' : `/${source.repo}/`;
      if (pages.cname || url.protocol !== 'https:' || url.hostname.toLowerCase() !== `${source.owner.toLowerCase()}.github.io` || url.pathname !== expectedPath || url.username || url.password || url.search || url.hash) throw conflict();
      if (source.format === 'react') {
        const builds = await runs(source);
        if (!builds.length) {
          try { await request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', { owner: source.owner, repo: source.repo, workflow_id: 'pages.yml', ref: 'gitfolio' }); }
          catch (error) { if (!(error instanceof ServiceError) || !['GITHUB_WRITE_CONFLICT', 'GITHUB_NOT_FOUND'].includes(error.code)) throw error; }
          return { status: 'pending' };
        }
        const build = builds[0];
        const buildUrl = new URL(build.html_url);
        if (buildUrl.protocol !== 'https:' || buildUrl.hostname !== 'github.com' || !buildUrl.pathname.startsWith(`/${source.owner}/${source.repo}/actions/runs/`)) throw conflict();
        return { status: build.status !== 'completed' ? 'pending' : build.conclusion === 'success' ? 'live' : 'failed',
          ...(build.status === 'completed' && build.conclusion === 'success' ? { pagesUrl: url.href } : {}), buildUrl: buildUrl.href };
      }
      const build = await optional('GET /repos/{owner}/{repo}/pages/builds/latest', { owner: source.owner, repo: source.repo });
      if (build === null) return { status: 'pending' };
      const parsed = z.object({ commit: sha, status: z.string() }).parse(build);
      if (parsed.commit !== source.commitSha) return { status: 'pending' };
      return { status: parsed.status === 'built' ? 'live' : parsed.status === 'errored' ? 'failed' : 'pending', ...(parsed.status === 'built' ? { pagesUrl: url.href } : {}) };
    },
  };
}
