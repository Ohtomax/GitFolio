import { Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Brand() {
  return <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight" aria-label="GitFolio home">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-lime-300"><Code2 size={22} aria-hidden="true" /></span>
    GitFolio<span className="text-lime-600">.</span>
  </Link>;
}
