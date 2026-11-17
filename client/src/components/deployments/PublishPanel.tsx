import { useRef } from 'react';
import { Rocket } from 'lucide-react';
import type { Deployment, Project, StartDeploymentInput } from '@gitfolio/shared';
import { usePublishCapability, useStartDeployment } from '../../hooks/useDeployments.ts';
import { useAuthStore } from '../../stores/auth.store.ts';
import { RETURN_TO_KEY } from '../../utils/auth-navigation.ts';
import { errorMessage } from '../../utils/errorParser.ts';

export function PublishPanel({ project, capability, reconnect, onStarted }: {
  project: Project; capability: ReturnType<typeof usePublishCapability>; reconnect: boolean; onStarted: (deployment: Deployment) => void;
}) {
  const publish = useStartDeployment();
  const request = useRef<StartDeploymentInput | null>(null);
  const login = useAuthStore((state) => state.user?.login ?? 'your-account');
  const config = capability.data;
  const archived = project.status === 'ARCHIVED' || config?.archived;
  const busy = publish.isPending || capability.isFetching;
  function authorize() {
    if (!config || archived || busy) return;
    try { sessionStorage.setItem(RETURN_TO_KEY, `/projects/${project.id}/deployments`); } catch { /* Sign-in returns to the dashboard if storage is unavailable. */ }
    window.location.assign(`/api/auth/github/publish?format=${config.format}`);
  }
  function start() {
    if (!config || archived || busy || !config.authorized || config.activeDeploymentId || capability.isError) return;
    if (!window.confirm(`Publish saved version ${config.editorRevision + 1} to the public repository ${login}/${config.repositoryName}? The generated portfolio files and site will be public.`)) return;
    if (!request.current || request.current.editorRevision !== config.editorRevision || request.current.repositoryName !== config.repositoryName || request.current.format !== config.format) {
      request.current = { requestId: crypto.randomUUID(), editorRevision: config.editorRevision, repositoryName: config.repositoryName, format: config.format };
    }
    publish.mutate({ projectId: project.id, input: request.current }, { onSuccess: (deployment) => { request.current = null; onStarted(deployment); } });
  }
  return <section aria-labelledby="publish-settings-title" className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
    <div className="flex flex-col items-start justify-between gap-5 sm:flex-row"><div className="min-w-0 flex-1"><h2 id="publish-settings-title" className="text-lg font-semibold tracking-tight">Ready to share?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Publish a saved version of your portfolio. Editing a draft keeps the current public site in place until you publish again.</p>
      {config ? <p className="mt-4 break-all rounded-lg bg-stone-50 px-3 py-2 font-mono text-xs text-stone-600">github.com/{login}/{config.repositoryName}<span className="ml-2 whitespace-nowrap font-sans text-stone-400">· Public · Version {config.editorRevision + 1}</span></p> : capability.isPending ? <div role="status" aria-label="Loading publishing settings" className="mt-4 h-10 max-w-lg animate-pulse rounded-lg bg-stone-100" /> : null}
    </div><button type="button" className="primary-button inline-flex shrink-0 items-center gap-2" disabled={!config || !config.authorized || archived || busy || Boolean(config.activeDeploymentId) || capability.isError} onClick={start}><Rocket size={15} aria-hidden="true" />{publish.isPending ? 'Starting deployment…' : config?.activeDeploymentId ? 'Deployment in progress' : publish.isError ? 'Retry publish request' : 'Publish portfolio'}</button></div>
    {archived && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Restore this project from the dashboard before publishing. Existing deployment history is available below.</p>}
    {config && (!config.authorized || reconnect) && !archived && <div className="mt-5 rounded-xl border border-lime-200 bg-lime-50 p-4"><h3 className="text-sm font-semibold text-stone-800">Connect publishing access</h3><p className="mt-2 max-w-3xl text-xs leading-6 text-stone-600">GitHub requires repository access for Pages{config.format === 'react' ? ' and workflow access for React builds' : ''}. Its repository permission also includes private repositories. GitFolio publishes only public repositories that it manages. Authorizing access does not start a deployment.</p><button type="button" className="mt-3 rounded-lg border border-lime-700 px-3 py-2 text-xs font-semibold text-lime-900 disabled:opacity-40" disabled={busy} onClick={authorize}>{config.authorized ? 'Reconnect publishing access' : 'Authorize publishing'}</button></div>}
    {capability.isError && <div role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><p>{errorMessage(capability.error)}</p><button type="button" className="mt-3 text-xs font-semibold underline" disabled={capability.isFetching} onClick={() => void capability.refetch()}>Reload publishing settings</button></div>}
    {publish.isError && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900"><p>{errorMessage(publish.error)}</p><p className="mt-2 text-xs leading-5">Check the deployment history before retrying. Your saved project is safe.</p><button type="button" className="mt-3 text-xs font-semibold underline" onClick={() => void capability.refetch()}>Refresh publishing status</button></div>}
  </section>;
}
