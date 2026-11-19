import { TemplateSchema } from '../validation/template.schema.js';

export const glassmorphicBentoTemplate = /* @__PURE__ */ TemplateSchema.parse({
  id: '10000000-0000-4000-8000-000000000008',
  name: 'Glassmorphic Bento',
  category: 'creative',
  isReact: false,
  thumbnailUrl: null,
  description: 'Dark glass tiles on a deep mesh-gradient canvas — the modular identity grid of a creative technologist.',
  defaultConfig: {
    theme: {
      layout: 'bento',
      demo: true,
      colors: {
        background: '#0a0a12',
        surface:    '#141420',
        text:       '#f4f4f8',
        muted:      '#8b8ba0',
        accent:     '#34d399',
        border:     '#1f1f30',
      },
      font: 'sans',
      headingFont: 'sans',
      spacing: 'comfortable',
    },
    sections: [
      {
        type: 'hero', visible: true,
        content: {
          eyebrow: 'Soren Villanueva / Creative Technologist  ●  OPEN TO WORK',
          heading: 'Design that ships. Code that feels.',
          subtitle: 'Design Engineering · Amsterdam, NL',
          description: 'I sit at the intersection of Figma and the browser. I prototype fast, build precise, and care about the last 10 % that makes an interface feel alive.',
          buttonLabel: 'Let\'s create something ↗',
          buttonUrl: 'mailto:soren@example.com',
          tags: ['React', 'Motion', 'Figma', 'TypeScript'],
          metrics: [
            { value: '32',   label: 'Shipped experiments' },
            { value: '6',    label: 'Design systems maintained' },
            { value: '100%', label: 'Side projects finished (eventually)' },
          ],
        },
      },
      {
        type: 'now', visible: true,
        content: {
          heading: 'What\'s on right now.',
          description: 'Small signals from the studio.',
          items: [
            {
              title: 'Currently building',
              subtitle: 'A spatial UI experiment for the browser',
              description: 'Exploring 3D transforms and scroll-driven animations in pure CSS — no library, no excuses.',
            },
            {
              title: 'On repeat',
              subtitle: 'A slow ambient playlist',
              description: 'Something between Brian Eno and a coffee shop at 7 a.m. Perfect for deep-focus sessions.',
            },
          ],
        },
      },
      {
        type: 'projects', visible: true,
        content: {
          heading: 'Made with intent and curiosity.',
          description: 'A mix of shipped interfaces, tools, and useful little experiments.',
          items: [
            {
              title: 'Halo — an accessible icon system',
              subtitle: 'Design engineering · 2026',
              description: 'Open-source icon library with consistent optical weight, full ARIA support, and tree-shakeable React components.',
              url: 'https://example.com/halo',
              visual: 'typography',
              tags: ['SVG', 'React', 'Accessibility'],
            },
            {
              title: 'Groundwork — a design token pipeline',
              subtitle: 'Creative tool · 2025',
              description: 'A CLI that syncs Figma variables to W3C design tokens and generates typed TypeScript constants automatically.',
              url: 'https://example.com/groundwork',
              visual: 'code',
              tags: ['Node.js', 'Figma API', 'TypeScript'],
            },
            {
              title: 'Float — a micro-interaction playground',
              subtitle: 'Experiment · 2024',
              description: 'A collection of 24 reusable Framer Motion recipes with copy-paste code snippets and reduced-motion variants.',
              url: 'https://example.com/float',
              visual: 'mobile',
              tags: ['Framer Motion', 'React', 'CSS'],
            },
          ],
        },
      },
      {
        type: 'skills', visible: true,
        content: {
          heading: 'My everyday kit.',
          description: 'Enough range to take an idea from sketch to browser.',
          tags: ['Figma', 'React', 'TypeScript', 'CSS', 'Framer Motion', 'Storybook', 'SVG', 'Accessibility'],
          items: [
            { title: 'Always in the loop', description: 'Prototyping · Design systems · Motion design · Visual storytelling · Component architecture' },
          ],
        },
      },
      {
        type: 'about', visible: true,
        content: {
          heading: 'Equal parts sketchbook and source code.',
          description: 'I feel most at home between a design file and a working prototype. My process is hands-on: make something small, put it in front of a real person, notice the friction, make it better.\n\nOutside the studio: film photography, secondhand bookshops, and an ever-growing backlog of side projects I fully intend to finish.',
        },
      },
      {
        type: 'contact', visible: true,
        content: {
          heading: 'Good things start with a hello.',
          description: 'Have an idea that could use a little design and a lot of care? My inbox is open.',
          buttonLabel: 'Say hello ↗',
          buttonUrl: 'mailto:soren@example.com',
          items: [
            { title: 'Email ↗',           url: 'mailto:soren@example.com' },
            { title: 'GitHub ↗',          url: 'https://example.com/soren/code' },
            { title: 'Design notes ↗',    url: 'https://example.com/soren/notes' },
          ],
        },
      },
    ],
  },
});
