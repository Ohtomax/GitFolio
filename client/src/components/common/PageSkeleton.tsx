export function PageSkeleton({ label = 'Loading your session' }: { label?: string }) {
  return <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-5 px-6" role="status" aria-label={label}>
    <div className="h-10 w-36 animate-pulse rounded-xl bg-stone-200" />
    <div className="h-6 w-3/4 animate-pulse rounded-lg bg-stone-200" />
    <div className="h-28 animate-pulse rounded-2xl bg-stone-200" />
    <p className="text-sm text-stone-500">{label}…</p>
  </main>;
}
