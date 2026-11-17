import { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { IdParamsSchema, type Deployment, type Project } from '@gitfolio/shared';
import { WorkspaceShell } from '../components/common/WorkspaceShell.tsx';
import { PageSkeleton } from '../components/common/PageSkeleton.tsx';
import { DeploymentBadge, DeploymentDetails } from '../components/deployments/DeploymentDetails.tsx';
import { PublishPanel } from '../components/deployments/PublishPanel.tsx';
import { useProject } from '../hooks/useProjects.ts';
import { useDeployment, useDeployments, usePublishCapability } from '../hooks/useDeployments.ts';
import { useAuthStore } from '../stores/auth.store.ts';
import { errorMessage } from '../utils/errorParser.ts';

function DeploymentWorkspace({ project }: { project: Project }) {
  const [page, setPage] = useState(1);
  const [params, setParams] = useSearchParams();
  const capability = usePublishCapability(project.id);
  const history = useDeployments(project.id, { page, pageSize: 6 });
  const requested = params.get('deployment');
  const validSelection = requested === null || IdParamsSchema.safeParse({ id: requested }).success;
  const activeId = capability.data?.activeDeploymentId ?? '';
  const selectedId = validSelection ? requested ?? (activeId || history.data?.items[0]?.id || '') : '';
  const active = useDeployment(activeId);
  const selected = useDeployment(selectedId === activeId ? '' : selectedId);
  const details = selectedId === activeId ? active : selected;
  const belongs = details.data?.projectId === project.id;
  const reconnect = belongs && ['GITHUB_PERMISSION_REQUIRED', 'GITHUB_REAUTH_REQUIRED'].includes(details.data?.errorCode ?? '');
  function select(id: string) { setParams((previous) => { const next = new URLSearchParams(previous); next.set('deployment', id); return next; }); }
  function started(deployment: Deployment) { setPage(1); select(deployment.id); }
  return <WorkspaceShell><main className="mx-auto max-w-7xl px-5 py-9 sm:px-10 sm:py-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div className="min-w-0"><Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-stone-500"><ArrowLeft size={13} aria-hidden="true" />All projects</Link><p className="mb-2 mt-6 break-words text-[10px] font-semibold uppercase tracking-[.2em] text-stone-400">{project.name}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Publish your work<span className="text-lime-600">.</span></h1></div><Link to={`/projects/${project.id}/edit`} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold">Back to editor</Link></div>
    <PublishPanel project={project} capability={capability} reconnect={reconnect} onStarted={started} />
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
      <section aria-labelledby="deployment-history-title" className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-3"><h2 id="deployment-history-title" className="text-lg font-semibold tracking-tight">Deployment history</h2><button type="button" aria-label="Refresh deployment history" className="rounded-lg border border-stone-200 p-2 text-stone-500 disabled:opacity-40" disabled={history.isFetching} onClick={() => { void history.refetch(); void capability.refetch(); }}><RefreshCw size={14} aria-hidden="true" /></button></div>
        {history.isPending ? <div role="status" aria-label="Loading deployment history" className="space-y-3">{[0, 1, 2].map(index => <div key={index} className="h-24 animate-pulse rounded-xl bg-stone-100" />)}</div> : history.data?.items.length ? <ol aria-label="Deployment history" className="space-y-3">{history.data.items.map((item) => {
          const current = details.data?.id === item.id && belongs ? details.data : active.data?.id === item.id ? active.data : item;
          return <li key={item.id}><button type="button" aria-label={`View deployment ${item.id}`} aria-pressed={selectedId === item.id} className={`w-full rounded-xl border p-4 text-left ${selectedId === item.id ? 'border-lime-600 bg-lime-50/60' : 'border-stone-200 hover:bg-stone-50'}`} onClick={() => select(item.id)}><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">Version {item.editorRevision + 1}</span><DeploymentBadge status={current.status} /></span><time dateTime={item.startedAt} className="mt-3 block text-[11px] text-stone-500">{new Date(item.startedAt).toLocaleString()}</time><span className="mt-1 block truncate font-mono text-[10px] text-stone-400">{current.commitSha ? current.commitSha.slice(0, 7) : item.repositoryName || 'Preparing repository'}</span></button></li>;
        })}</ol> : !history.isError && <div className="rounded-xl bg-stone-50 px-5 py-10 text-center"><p className="text-sm font-semibold">Your first launch starts here.</p><p className="mt-3 text-xs leading-6 text-stone-500">Publish a saved version to see its progress and history here.</p></div>}
        {history.isError && <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-900"><p>{errorMessage(history.error)}</p><button type="button" className="mt-2 font-semibold underline" onClick={() => void history.refetch()}>Reload history</button></div>}
        {history.data && history.data.totalPages > 1 && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 text-xs"><span className="text-stone-400">Page {page} of {history.data.totalPages}</span><div className="flex gap-2"><button type="button" className="rounded-lg border border-stone-200 px-3 py-2 disabled:opacity-40" disabled={page <= 1 || history.isFetching} onClick={() => setPage(value => value - 1)}>Previous</button><button type="button" className="rounded-lg border border-stone-200 px-3 py-2 disabled:opacity-40" disabled={page >= history.data.totalPages || history.isFetching} onClick={() => setPage(value => value + 1)}>Next</button></div></div>}
      </section>
      <div className="min-w-0">{!validSelection ? <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm">This deployment link is invalid. Select an attempt from the history.</p>
        : selectedId ? <>{details.data && belongs ? <DeploymentDetails deployment={details.data} checking={details.isFetching} /> : details.data ? <p role="alert" className="rounded-2xl bg-amber-50 p-6 text-sm">This deployment does not belong to this project. Select an attempt from the history.</p> : details.isPending ? <div role="status" aria-label="Loading deployment details" className="h-96 animate-pulse rounded-2xl bg-stone-200/60" /> : null}
          {details.isError && <div role="alert" className="mt-4 rounded-xl bg-amber-50 p-5 text-sm text-amber-900"><p>{errorMessage(details.error)}</p><button type="button" className="mt-3 text-xs font-semibold underline" onClick={() => void details.refetch()}>Retry status</button></div>}</>
          : <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm leading-7 text-stone-400">Choose a deployment to see its progress, source, and logs.</div>}
      </div>
    </div>
  </main></WorkspaceShell>;
}
export default function DeploymentsPage() {
  const { id = '' } = useParams(), project = useProject(id);
  const owner = useAuthStore((state) => state.user?.id ?? '');
  if (!IdParamsSchema.safeParse({ id }).success) return <WorkspaceShell><main role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">This project link is invalid.</h1></main></WorkspaceShell>;
  if (project.isPending) return <PageSkeleton label="Loading publishing workspace" />;
  if (!project.data) return <WorkspaceShell><main role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">This project couldn’t load.</h1><p className="my-4 text-sm text-stone-500">{errorMessage(project.error)}</p><button type="button" className="primary-button" onClick={() => void project.refetch()}>Try again</button></main></WorkspaceShell>;
  return <DeploymentWorkspace key={`${owner}:${id}`} project={project.data} />;
}
