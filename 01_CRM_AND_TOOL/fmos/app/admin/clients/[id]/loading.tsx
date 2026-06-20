export default function ClientProfileLoading() {
  return (
    <div className="min-h-full bg-canvas px-4 py-6 animate-pulse">
      <div className="mx-auto max-w-6xl">
        <div className="h-4 w-28 rounded bg-slate-200 mb-6" />
        <div className="bg-surface rounded-xl border border-line p-6 mb-6">
          <div className="h-8 w-64 rounded-lg bg-slate-200 mb-3" />
          <div className="h-4 w-96 rounded bg-slate-100 mb-3" />
          <div className="h-4 w-48 rounded bg-slate-100" />
        </div>
        <div className="flex gap-4 border-b border-line mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-24 rounded bg-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 rounded-xl bg-surface border border-line" />
          <div className="h-64 rounded-xl bg-surface border border-line" />
          <div className="h-64 rounded-xl bg-surface border border-line" />
        </div>
      </div>
    </div>
  );
}
