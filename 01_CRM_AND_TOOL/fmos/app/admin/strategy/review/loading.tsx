export default function Loading() {
  return (
    <div className="min-h-full bg-slate-50 px-4 py-8 animate-pulse">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-4 w-24 rounded bg-slate-200 mb-4" />
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="h-10 w-48 rounded-lg bg-slate-200" />
        </div>
        <div className="h-[200px] w-full rounded-xl bg-white border border-slate-200" />
        <div className="h-[400px] w-full rounded-xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}
