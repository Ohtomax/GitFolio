import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { IdParamsSchema, ProjectQuerySchema, type CreateProjectInput, type Project, type ProjectQuery, type UpdateProjectInput } from '@gitfolio/shared';
import { projectService } from '../services/project.service.ts';
import { useAuthStore } from '../stores/auth.store.ts';

export const projectKeys = {
  all: (userId: string) => ['projects', userId] as const,
  lists: (userId: string) => ['projects', userId, 'list'] as const,
  list: (userId: string, query: ProjectQuery) => ['projects', userId, 'list', query] as const,
  detail: (userId: string, id: string) => ['projects', userId, 'detail', id] as const,
};
export function projectListOptions(userId: string, filters: Partial<ProjectQuery> = {}) {
  const query = ProjectQuerySchema.parse(filters);
  return queryOptions({ queryKey: projectKeys.list(userId, query),
    queryFn: ({ signal }) => projectService.list(query, signal), enabled: Boolean(userId), staleTime: 5 * 60000,
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[1] === userId ? previous : undefined,
  });
}
export function projectDetailOptions(userId: string, id: string) {
  return queryOptions({ queryKey: projectKeys.detail(userId, id),
    queryFn: ({ signal }) => projectService.get(id, signal), enabled: Boolean(userId) && IdParamsSchema.safeParse({ id }).success, staleTime: 5 * 60000 });
}
const stillSignedIn = (userId: string) => useAuthStore.getState().user?.id === userId;

export function createProjectMutationOptions(queryClient: QueryClient, userId: string) {
  return { mutationFn: (input: CreateProjectInput) => projectService.create(input),
    onSuccess: async (project: Project) => {
      if (!stillSignedIn(userId)) return;
      queryClient.setQueryData(projectKeys.detail(userId, project.id), project);
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) });
    },
  };
}
export function updateProjectMutationOptions(queryClient: QueryClient, userId: string) {
  return { mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) => projectService.update(id, data),
    onSuccess: async (project: Project) => {
      if (!stillSignedIn(userId)) return;
      queryClient.setQueryData(projectKeys.detail(userId, project.id), project);
      await Promise.all([queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) }),
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(userId, project.id), refetchType: 'none' })]);
    },
  };
}
export function deleteProjectMutationOptions(queryClient: QueryClient, userId: string) {
  return { mutationFn: (id: string) => projectService.delete(id),
    onSuccess: async (_data: null, id: string) => {
      if (!stillSignedIn(userId)) return;
      queryClient.removeQueries({ queryKey: projectKeys.detail(userId, id), exact: true });
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists(userId) });
    },
  };
}
export function useProjects(filters: Partial<ProjectQuery> = {}) {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useQuery(projectListOptions(userId, filters));
}
export function useProject(id: string) {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useQuery(projectDetailOptions(userId, id));
}
export function useCreateProject() {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useMutation({ ...createProjectMutationOptions(useQueryClient(), userId), meta: { notice: { ownerId: userId, pending: 'Creating project…', success: 'Project created.' } } });
}
export function useUpdateProject() {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useMutation({ ...updateProjectMutationOptions(useQueryClient(), userId), meta: { notice: { ownerId: userId, pending: 'Updating project…', success: 'Project updated.' } } });
}
export function useDeleteProject() {
  const userId = useAuthStore((state) => state.user?.id ?? '');
  return useMutation({ ...deleteProjectMutationOptions(useQueryClient(), userId), meta: { notice: { ownerId: userId, pending: 'Deleting project…', success: 'Project deleted.' } } });
}
