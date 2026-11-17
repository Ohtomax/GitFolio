import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { Project } from '@gitfolio/shared';
import { acquireEditorDraft, releaseEditorDraft, type EditorDraft } from '../src/utils/editor-draft-cache.ts';

function project(): Project {
  const template = { id: randomUUID(), name: 'Canvas', description: 'Fixture', category: 'minimal' as const, thumbnailUrl: null, isReact: false };
  return { id: randomUUID(), templateId: template.id, template, name: 'Portfolio', slug: 'portfolio', status: 'DRAFT',
    editorRevision: 0, repoName: null, sectionCount: 0, sections: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    themeConfig: { colors: { accent: '#65a30d', background: '#fafaf9', text: '#1c1917' }, font: 'sans', spacing: 'comfortable' } };
}
function edit(draft: EditorDraft) {
  const document = draft.store.getState().document;
  draft.store.getState().setDocument({ ...document, themeConfig: { ...document.themeConfig, font: 'serif' } });
}
test('interrupted drafts retain history and revision only for the same owner and project', () => {
  const saved = project(), owner = randomUUID();
  const draft = acquireEditorDraft(owner, saved); edit(draft); draft.revision = 2;
  releaseEditorDraft(owner, saved.id, draft);
  const recovered = acquireEditorDraft(owner, saved);
  assert.equal(recovered, draft); assert.equal(recovered.recovered, true); assert.equal(recovered.revision, 2);
  assert.equal(recovered.store.getState().past.length, 1);
  assert.equal(acquireEditorDraft(randomUUID(), saved).store.getState().dirty, false);
  assert.equal(acquireEditorDraft(owner, project()).recovered, false);
  draft.retain = false; releaseEditorDraft(owner, saved.id, draft);
});
test('explicitly discarded and acknowledged clean drafts cannot be recovered', () => {
  const saved = project(), owner = randomUUID();
  const discarded = acquireEditorDraft(owner, saved); edit(discarded); discarded.retain = false;
  releaseEditorDraft(owner, saved.id, discarded);
  assert.equal(acquireEditorDraft(owner, saved).recovered, false);
  const clean = acquireEditorDraft(owner, saved); edit(clean);
  releaseEditorDraft(owner, saved.id, clean);
  clean.store.getState().markSaved(clean.store.getState().document);
  assert.equal(acquireEditorDraft(owner, saved).recovered, false);
});
