export default function TeamLoading() {
  return (
    <div role="status" aria-label="Loading team performance" className="mx-auto max-w-7xl space-y-5">
      <p className="text-sm font-medium text-slate-500">Loading team performance...</p>
      <div className="h-16 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />)}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />
    </div>
  );
}
