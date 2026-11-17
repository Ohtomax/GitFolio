import assert from 'node:assert/strict';
import test from 'node:test';
import { ProjectSlugSchema } from '@gitfolio/shared';
import { projectSlug } from '../src/utils/project-slug.ts';

test('project name suggestions produce safe bounded slugs across accents, spaces, punctuation, and long names', () => {
  assert.equal(projectSlug('  My Résumé & Work  '), 'my-resume-work');
  assert.equal(projectSlug('___Hello---World!'), 'hello-world');
  for (const name of ['A'.repeat(150), 'a-'.repeat(50), 'Developer’s work']) {
    const slug = projectSlug(name);
    ProjectSlugSchema.parse(slug);
    assert.ok(slug.length <= 63);
  }
  assert.equal(projectSlug('🎨'), '');
});
