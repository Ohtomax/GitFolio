import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useEditorDraft } from '../components/editor/EditorProvider.tsx';

export function useEditorNavigation() {
  const draft = useEditorDraft();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => draft.store.getState().dirty
    && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!draft.store.getState().dirty) return;
      event.preventDefault(); event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [draft]);
  return {
    blocker,
    leave() { draft.retain = false; if (blocker.state === 'blocked') blocker.proceed(); },
    beforeLogout() {
      if (draft.store.getState().dirty && !window.confirm('Leave the editor and sign out? Changes that have not saved will be lost.')) return false;
      draft.retain = false; return true;
    },
  };
}
