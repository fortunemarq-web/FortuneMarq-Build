export default function AgencyGrowthLoading() {
  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 animate-pulse">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <div className="h-8 w-64 rounded-lg bg-slate-200 mb-2" />
            <div className="h-4 w-96 rounded bg-slate-200" />
          </div>
          <div className="h-10 w-64 rounded-xl bg-slate-200 mt-4 md:mt-0" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-slate-200 h-28" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-xl border border-slate-200 h-[380px]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-surface rounded-xl border border-slate-200 h-[220px]" />
              ))}
            </div>
          </div>
          <div className="bg-surface rounded-xl border border-slate-200 h-[600px] min-h-full" />
        </div>
      </div>
    </div>
  );
}
