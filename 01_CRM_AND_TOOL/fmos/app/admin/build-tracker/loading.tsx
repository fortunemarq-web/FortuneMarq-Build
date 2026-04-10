export default function BuildTrackerLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-8 flex items-start justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-8 w-52 rounded-lg bg-slate-200" />
            <div className="h-4 w-72 rounded bg-slate-200" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-slate-200" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>

        {/* System cards skeleton */}
        <div className="space-y-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-48 rounded bg-slate-100" />
                  <div className="h-7 w-12 rounded bg-slate-100" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100" />
              </div>
              <div className="border-t border-slate-100 p-6 space-y-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="h-4 flex-1 rounded bg-slate-100" />
                    <div className="h-6 w-24 rounded-full bg-slate-100" />
                    <div className="h-5 w-16 rounded-full bg-slate-100" />
                    <div className="h-4 w-28 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
