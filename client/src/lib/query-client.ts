import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth.store.ts';
import { errorMessage } from '../utils/errorParser.ts';

interface NotificationMeta extends Record<string, unknown> {
  notice?: { pending?: string; success?: string; ownerId?: string };
}
declare module '@tanstack/react-query' {
  interface Register { mutationMeta: NotificationMeta }
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60000, retry: false } },
    mutationCache: new MutationCache({
      onMutate: (_variables, mutation) => {
        const notice = mutation.meta?.notice;
        if (notice?.pending && (!notice.ownerId || notice.ownerId === useAuthStore.getState().user?.id)) {
          toast.loading(notice.pending, { id: `mutation-${mutation.mutationId}` });
        }
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        const notice = mutation.meta?.notice, id = `mutation-${mutation.mutationId}`;
        if (!notice || (notice.ownerId && notice.ownerId !== useAuthStore.getState().user?.id)) { toast.dismiss(id); return; }
        if (notice.success) toast.success(notice.success, { id });
        else toast.dismiss(id);
      },
      onError: (error, _variables, _context, mutation) => {
        const notice = mutation.meta?.notice, id = `mutation-${mutation.mutationId}`;
        if (!notice || (notice.ownerId && notice.ownerId !== useAuthStore.getState().user?.id)) { toast.dismiss(id); return; }
        toast.error(errorMessage(error), { id });
      },
    }),
  });
}
