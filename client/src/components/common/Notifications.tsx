import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useAuthStore } from '../../stores/auth.store.ts';

export function Notifications() {
  const ownerId = useAuthStore((state) => state.user?.id);
  useEffect(() => { toast.dismiss(); }, [ownerId]);
  return <Toaster richColors closeButton position="bottom-right" visibleToasts={3} duration={4500} />;
}
