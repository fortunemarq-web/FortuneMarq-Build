export default function PlatformLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 animate-pulse">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-4 w-24 rounded bg-slate-200 mb-4" />
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="h-10 w-64 rounded-lg bg-slate-200" />
          <div className="flex gap-3 mt-4 md:mt-0">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 w-32 rounded-lg bg-white border border-slate-200" />
            ))}
          </div>
        </div>
        <div className="h-[400px] w-full rounded-xl bg-white border border-slate-200" />
        <div className="h-[500px] w-full rounded-xl bg-slate-100/50 border border-slate-200" />
        <div className="h-[300px] w-full rounded-xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}
