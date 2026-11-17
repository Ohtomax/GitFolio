import { useEffect } from 'react';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IdParamsSchema, type Deployment, type DeploymentQuery, type StartDeploymentInput } from '@gitfolio/shared';
import { deploymentService } from '../services/deployment.service.ts';
import { useAuthStore } from '../stores/auth.store.ts';
import { projectKeys } from './useProjects.ts';

export const isDeploymentActive = (status?: Deployment['status']) => Boolean(status && ['PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING'].includes(status));
export const deploymentKeys = {
  all: (owner: string) => ['deployments', owner] as const,
  histories: (owner: string, projectId: string) => ['deployments', owner, 'history', projectId] as const,
  history: (owner: string, projectId: string, filters: Partial<DeploymentQuery>) => ['deployments', owner, 'history', projectId, filters] as const,
  detail: (owner: string, id: string) => ['deployments', owner, 'detail', id] as const,
  capability: (owner: string, projectId: string) => ['deployments', owner, 'capability', projectId] as const,
};
const valid = (value: string) => IdParamsSchema.safeParse({ id: value }).success;
export function deploymentDetailOptions(owner: string, id: string) {
  return queryOptions({ queryKey: deploymentKeys.detail(owner, id), queryFn: ({ signal }) => deploymentService.get(id, signal),
    staleTime: 0, enabled: Boolean(owner) && valid(id), refetchInterval: (query) => isDeploymentActive(query.state.data?.status) ? 3000 : false,
    refetchIntervalInBackground: false, retry: false });
}
export function deploymentHistoryOptions(owner: string, projectId: string, filters: Partial<DeploymentQuery> = {}) {
  return queryOptions({ queryKey: deploymentKeys.history(owner, projectId, filters), queryFn: ({ signal }) => deploymentService.list(projectId, filters, signal),
    enabled: Boolean(owner) && valid(projectId), staleTime: 30000, retry: false });
}
export function startDeploymentOptions(queryClient: ReturnType<typeof useQueryClient>, owner: string) {
  return { mutationFn: ({ projectId, input }: { projectId: string; input: StartDeploymentInput }) => deploymentService.start(projectId, input), retry: false,
    onSuccess: async (deployment: Deployment) => {
      if (useAuthStore.getState().user?.id !== owner) return;
      queryClient.setQueryData(deploymentKeys.detail(owner, deployment.id), deployment);
      await Promise.all([queryClient.invalidateQueries({ queryKey: deploymentKeys.histories(owner, deployment.projectId) }),
        queryClient.invalidateQueries({ queryKey: deploymentKeys.capability(owner, deployment.projectId) })]);
    },
  };
}
const useOwner = () => useAuthStore((state) => state.status === 'authenticated' ? state.user?.id ?? '' : '');
export function useDeployment(id: string) {
  const owner = useOwner(), queryClient = useQueryClient();
  const query = useQuery(deploymentDetailOptions(owner, id));
  useEffect(() => {
    if (!query.data || useAuthStore.getState().user?.id !== owner || isDeploymentActive(query.data.status)) return;
    void queryClient.invalidateQueries({ queryKey: deploymentKeys.histories(owner, query.data.projectId) });
    void queryClient.invalidateQueries({ queryKey: deploymentKeys.capability(owner, query.data.projectId) });
    if (query.data.status === 'LIVE') {
      void queryClient.invalidateQueries({ queryKey: projectKeys.detail(owner, query.data.projectId) });
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists(owner) });
    }
  }, [owner, query.data, queryClient]);
  return query;
}
export function useDeployments(projectId: string, filters: Partial<DeploymentQuery> = {}) { return useQuery(deploymentHistoryOptions(useOwner(), projectId, filters)); }
export function usePublishCapability(projectId: string) {
  const owner = useOwner();
  return useQuery({ queryKey: deploymentKeys.capability(owner, projectId), queryFn: ({ signal }) => deploymentService.capability(projectId, signal),
    enabled: Boolean(owner) && valid(projectId), staleTime: 0, retry: false });
}
export function useStartDeployment() { const owner = useOwner(); return useMutation(startDeploymentOptions(useQueryClient(), owner)); }
