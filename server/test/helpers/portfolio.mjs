import { randomUUID } from 'node:crypto';
export function generatorProject() {
  const template = { id: randomUUID(), name: 'Canvas', description: 'A fixture', category: 'minimal', thumbnailUrl: null, isReact: false };
  return { id: randomUUID(), templateId: template.id, template, name: 'My portfolio', slug: 'my-portfolio', repoName: null,
    status: 'DRAFT', editorRevision: 0, sectionCount: 7, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    themeConfig: { colors: { accent: '#65a30d', background: '#fafaf9', text: '#1c1917' }, font: 'serif', spacing: 'compact' },
    sections: ['hero', 'about', 'projects', 'skills', 'experience', 'education', 'contact'].map((type, sortOrder) => ({ id: randomUUID(), type, sortOrder, visible: true,
      content: { heading: `My ${type}`, description: `About ${type}`, eyebrow: 'Welcome', buttonLabel: 'Contact', buttonUrl: 'mailto:fixture@example.test',
        items: [{ title: `${type} entry`, subtitle: 'Detail', description: 'A description', url: 'https://example.com/work' }] } })) };
}
