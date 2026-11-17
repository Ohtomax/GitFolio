import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createEditorStore, type EditorDocument } from '../src/stores/editor.store.ts';
import { createEditorSaveCoordinator } from '../src/utils/editor-save-coordinator.ts';

const initial = (): EditorDocument => ({ themeConfig: { colors: { accent: '#65a30d', background: '#ffffff', text: '#111111' }, font: 'sans', spacing: 'comfortable' },
  sections: [{ id: randomUUID(), type: 'hero', sortOrder: 0, visible: true, content: { heading: 'Initial', description: '' } }] });
function edit(store: ReturnType<typeof createEditorStore>, value: string) {
  const document = structuredClone(store.getState().document); document.sections[0].content.heading = value; store.getState().setDocument(document);
}
test('overlapping save requests serialize, preserve newer edits, and advance revisions once per acknowledged snapshot', async () => {
  const store = createEditorStore(initial());
  const calls: { heading: string; revision: number }[] = [];
  let resolveFirst: (value: { editorRevision: number }) => void = () => {};
  const coordinator = createEditorSaveCoordinator({ revision: 0, baseline: store.getState().savedDocument,
    getDocument: () => store.getState().document, onStatus: () => {}, onSaved: (snapshot) => store.getState().markSaved(snapshot),
    async request(snapshot, revision) {
      calls.push({ heading: snapshot.sections[0].content.heading, revision });
      if (calls.length === 1) return new Promise<{ editorRevision: number }>((resolve) => { resolveFirst = resolve; });
      return { editorRevision: revision + 1 };
    },
  });
  edit(store, 'First'); const first = coordinator.flush();
  edit(store, 'Second'); const second = coordinator.flush();
  assert.equal(first, second); assert.equal(calls.length, 1);
  resolveFirst({ editorRevision: 1 });
  assert.equal(await first, true);
  assert.deepEqual(calls, [{ heading: 'First', revision: 0 }, { heading: 'Second', revision: 1 }]);
  assert.equal(store.getState().dirty, false);
  assert.equal(store.getState().document.sections[0].content.heading, 'Second');
});
test('failed requests keep local changes and conflicts require an explicit fresh baseline', async () => {
  const store = createEditorStore(initial()); let requests = 0;
  const coordinator = createEditorSaveCoordinator({ revision: 0, baseline: store.getState().savedDocument,
    getDocument: () => store.getState().document, onStatus: () => {}, onSaved: (snapshot) => store.getState().markSaved(snapshot),
    async request() { requests++; throw Object.assign(new Error('Conflict'), { code: 'EDITOR_CONFLICT' }); },
  });
  edit(store, 'My draft');
  assert.equal(await coordinator.flush(), false);
  assert.equal(await coordinator.flush(), false);
  assert.equal(requests, 1); assert.equal(store.getState().dirty, true);
  assert.equal(coordinator.reset(3, store.getState().document), true);
  assert.equal(coordinator.getRevision(), 3);
});
test('network errors can be retried without marking an unsaved document clean', async () => {
  const store = createEditorStore(initial()); let fail = true;
  const coordinator = createEditorSaveCoordinator({ revision: 0, baseline: store.getState().savedDocument,
    getDocument: () => store.getState().document, onStatus: () => {}, onSaved: (snapshot) => store.getState().markSaved(snapshot),
    async request(_snapshot, revision) { if (fail) throw new Error('Offline'); return { editorRevision: revision + 1 }; },
  });
  edit(store, 'Offline draft'); assert.equal(await coordinator.flush(), false); assert.equal(store.getState().dirty, true);
  fail = false; assert.equal(await coordinator.flush(), true); assert.equal(store.getState().dirty, false);
});

test('a late acknowledgement updates only the original draft and does not start another request after unmount', async () => {
  const store = createEditorStore(initial()); let active = true; let calls = 0; let savedRevision = 0;
  let finish: (result: { editorRevision: number }) => void = () => {};
  const coordinator = createEditorSaveCoordinator({ revision: 0, baseline: store.getState().savedDocument,
    getDocument: () => store.getState().document, active: () => active, onStatus: () => {},
    onSaved(snapshot, result) { savedRevision = result.editorRevision; store.getState().markSaved(snapshot); },
    request: async () => { calls++; return new Promise<{ editorRevision: number }>((resolve) => { finish = resolve; }); },
  });
  edit(store, 'Sent'); const pending = coordinator.flush();
  edit(store, 'Still local'); void coordinator.flush(); active = false;
  finish({ editorRevision: 1 }); assert.equal(await pending, false);
  assert.equal(savedRevision, 1); assert.equal(calls, 1); assert.equal(store.getState().dirty, true);
  assert.equal(store.getState().document.sections[0].content.heading, 'Still local');
});
