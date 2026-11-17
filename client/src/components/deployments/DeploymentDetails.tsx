import { Check, ExternalLink } from 'lucide-react';
import { DEPLOYMENT_MESSAGES, type Deployment } from '@gitfolio/shared';

export const deploymentLabels: Record<Deployment['status'], string> = {
  PENDING: 'Queued', BUILDING: 'Generating', PUSHING: 'Committing', DEPLOYING: 'Publishing', LIVE: 'Live', FAILED: 'Failed',
};
export function DeploymentBadge({ status }: { status: Deployment['status'] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'LIVE' ? 'bg-lime-100 text-lime-900' : status === 'FAILED' ? 'bg-red-50 text-red-800' : 'bg-stone-100 text-stone-600'}`}>{deploymentLabels[status]}</span>;
}
const stages = ['PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING', 'LIVE'] as const;
const logStages = ['QUEUED', 'BUILDING', 'PUSHING', 'DEPLOYING', 'LIVE'];
export function DeploymentDetails({ deployment, checking }: { deployment: Deployment; checking: boolean }) {
  const current = deployment.status === 'FAILED'
    ? Math.max(0, ...deployment.logs.map((entry) => logStages.indexOf(entry.code))) : stages.indexOf(deployment.status);
  return <section aria-labelledby="deployment-detail-title" className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Deployment details</p><h2 id="deployment-detail-title" className="mt-2 text-xl font-semibold tracking-tight">Saved version {deployment.editorRevision + 1}</h2></div><DeploymentBadge status={deployment.status} /></div>
    <p role="status" aria-label="Deployment progress" className="mt-4 text-sm text-stone-600">{deploymentLabels[deployment.status]}{checking ? ' · checking progress…' : ''}</p>
    <ol aria-label="Deployment stages" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">{stages.map((stage, index) => {
      const complete = deployment.status === 'LIVE' || index < current;
      return <li key={stage} aria-current={index === current ? 'step' : undefined} className={`min-w-0 rounded-xl border p-3 ${complete ? 'border-lime-200 bg-lime-50' : index === current ? 'border-stone-400 bg-stone-50' : 'border-stone-100'}`}><span className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${complete ? 'bg-lime-700 text-white' : 'bg-stone-100 text-stone-500'}`}>{complete ? <Check size={12} aria-hidden="true" /> : index + 1}</span><span className="block text-[11px] font-medium text-stone-600">{deploymentLabels[stage]}</span></li>;
    })}</ol>
    {deployment.errorCode && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">{DEPLOYMENT_MESSAGES[deployment.errorCode]}</p>}
    <dl className="mt-6 space-y-3 border-y border-stone-100 py-5 text-xs"><div className="flex flex-wrap justify-between gap-2"><dt className="text-stone-400">Started</dt><dd><time dateTime={deployment.startedAt}>{new Date(deployment.startedAt).toLocaleString()}</time></dd></div>
      {deployment.repositoryName && <div className="flex flex-wrap justify-between gap-2"><dt className="text-stone-400">Repository</dt><dd className="min-w-0 break-all font-mono">{deployment.repositoryName}</dd></div>}
      <div className="flex flex-wrap justify-between gap-2"><dt className="text-stone-400">Output</dt><dd>{deployment.format === 'react' ? 'React + GitHub Actions' : deployment.format === 'static' ? 'Static portfolio' : 'Historical deployment'}</dd></div>
      {deployment.commitSha && <div className="flex justify-between gap-2"><dt className="text-stone-400">Commit</dt><dd className="font-mono">{deployment.commitSha.slice(0, 7)}</dd></div>}
      {deployment.completedAt && <div className="flex flex-wrap justify-between gap-2"><dt className="text-stone-400">Finished</dt><dd><time dateTime={deployment.completedAt}>{new Date(deployment.completedAt).toLocaleString()}</time></dd></div>}
    </dl>
    <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold">{deployment.status === 'LIVE' && deployment.pagesUrl && <a href={deployment.pagesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-lime-800">Open portfolio<ExternalLink size={12} aria-hidden="true" /></a>}{deployment.repositoryUrl && <a href={deployment.repositoryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-stone-600">View source<ExternalLink size={12} aria-hidden="true" /></a>}{deployment.buildUrl && <a href={deployment.buildUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-stone-600">Open build details<ExternalLink size={12} aria-hidden="true" /></a>}</div>
    <h3 className="mb-4 mt-8 text-xs font-semibold uppercase tracking-widest text-stone-400">Progress log</h3>
    {deployment.logs.length ? <ol aria-label="Deployment logs" className="max-h-80 space-y-4 overflow-y-auto rounded-xl bg-stone-50 p-4">{deployment.logs.map((entry, index) => <li key={`${entry.at}:${index}`} className="text-xs leading-6"><time dateTime={entry.at} className="mb-1 block font-mono text-[10px] text-stone-400">{new Date(entry.at).toLocaleTimeString()}</time><p className="whitespace-pre-wrap break-words text-stone-600">{entry.message}</p></li>)}</ol> : <p className="rounded-xl bg-stone-50 p-4 text-xs text-stone-500">No progress entries were saved for this historical deployment.</p>}
  </section>;
}
