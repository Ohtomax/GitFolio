import { useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useEditor, useEditorApi } from './EditorProvider.tsx';

export function EditorHistoryToolbar({ disabled = false }: { disabled?: boolean }) {
  const store = useEditorApi();
  const canUndo = useEditor((state) => state.past.length > 0);
  const canRedo = useEditor((state) => state.future.length > 0);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (disabled || event.isComposing || event.altKey || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' || key === 'y') {
        event.preventDefault();
        if (key === 'y' || event.shiftKey) store.getState().redo(); else store.getState().undo();
      }
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [disabled, store]);
  return <><button type="button" aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" className="rounded-lg border border-stone-300 bg-white p-2.5 disabled:opacity-35" disabled={disabled || !canUndo} onClick={() => store.getState().undo()}><Undo2 size={16} /></button><button type="button" aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" className="rounded-lg border border-stone-300 bg-white p-2.5 disabled:opacity-35" disabled={disabled || !canRedo} onClick={() => store.getState().redo()}><Redo2 size={16} /></button></>;
}
