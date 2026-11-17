export interface ProjectFieldValues { name: string; slug: string; repoName: string }
export type ProjectFieldErrors = Partial<Record<keyof ProjectFieldValues, string>>;
export function ProjectFields({ values, errors, onChange, disabled = false }: {
  values: ProjectFieldValues; errors: ProjectFieldErrors;
  onChange: (field: keyof ProjectFieldValues, value: string) => void; disabled?: boolean;
}) {
  return <div className="space-y-5">{([
    { field: 'name', label: 'Project name', max: 100, placeholder: 'My portfolio', help: 'A name to help you find this project.' },
    { field: 'slug', label: 'Project slug', max: 63, placeholder: 'my-portfolio', help: 'Lowercase letters, numbers, and single hyphens. Unique to your account.' },
    { field: 'repoName', label: 'Repository name (optional)', max: 100, placeholder: 'my-portfolio', help: 'The repository name to use when you publish.' },
  ] as const).map(({ field, label, max, placeholder, help }) => <div key={field}>
    <label htmlFor={`project-${field}`} className="mb-2 block text-sm font-semibold">{label}</label>
    <input id={`project-${field}`} name={field} value={values[field]} maxLength={max} placeholder={placeholder}
      disabled={disabled} autoComplete="off" spellCheck={false} required={field !== 'repoName'}
      aria-invalid={Boolean(errors[field])} aria-describedby={`project-${field}-help`}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-lime-600 disabled:opacity-60 ${errors[field] ? 'border-red-400' : 'border-stone-300'}`}
      onChange={(event) => onChange(field, event.target.value)} />
    <p id={`project-${field}-help`} className={`mt-2 text-xs leading-5 ${errors[field] ? 'text-red-700' : 'text-stone-500'}`}>{errors[field] || help}</p>
  </div>)}</div>;
}
