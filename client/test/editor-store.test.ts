import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createEditorStore, type EditorDocument } from '../src/stores/editor.store.ts';

const initial = (): EditorDocument => ({ themeConfig: { colors: { accent: '#65a30d', background: '#ffffff', text: '#111111' }, font: 'sans', spacing: 'comfortable' },
  sections: [{ id: randomUUID(), type: 'hero', sortOrder: 0, visible: true, content: { heading: 'Initial', description: '' } }] });
function heading(store: ReturnType<typeof createEditorStore>, value: string, group?: string) {
  const document = structuredClone(store.getState().document); document.sections[0].content.heading = value;
  store.getState().setDocument(document, group);
}
test('undo/redo restores immutable documents and new edits discard the redo branch', () => {
  const original = initial(), store = createEditorStore(original);
  heading(store, 'First'); heading(store, 'Second');
  store.getState().undo(); assert.equal(store.getState().document.sections[0].content.heading, 'First');
  store.getState().redo(); assert.equal(store.getState().document.sections[0].content.heading, 'Second');
  store.getState().undo(); heading(store, 'Branch'); assert.equal(store.getState().future.length, 0);
  assert.equal(original.sections[0].content.heading, 'Initial');
});
test('typing groups coalesce, structural changes remain separate, and history is bounded', () => {
  let time = 1000;
  const store = createEditorStore(initial(), () => time);
  heading(store, 'A', 'heading'); time += 100; heading(store, 'AB', 'heading');
  assert.equal(store.getState().past.length, 1);
  store.getState().undo(); assert.equal(store.getState().document.sections[0].content.heading, 'Initial');
  for (let index = 0; index < 100; index++) heading(store, String(index));
  assert.equal(store.getState().past.length, 50);
});
test('acknowledging an older save does not overwrite edits made while the request was running', () => {
  const store = createEditorStore(initial());
  heading(store, 'Saving'); const snapshot = store.getState().document;
  heading(store, 'Newer edit'); store.getState().markSaved(snapshot);
  assert.equal(store.getState().document.sections[0].content.heading, 'Newer edit');
  assert.equal(store.getState().dirty, true);
  store.getState().undo(); assert.equal(store.getState().dirty, false);
  store.getState().reset(initial()); assert.equal(store.getState().past.length, 0);
});
test('deleted section selection is restored by undo and stores cannot share mutable drafts', () => {
  const document = initial(), first = createEditorStore(document), second = createEditorStore(document);
  const selected = first.getState().selectedId;
  first.getState().setDocument({ ...first.getState().document, sections: [] });
  assert.equal(first.getState().selectedId, null);
  first.getState().undo(); assert.equal(first.getState().selectedId, selected);
  heading(first, 'Private draft'); assert.equal(second.getState().document.sections[0].content.heading, 'Initial');
});
