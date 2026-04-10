export default function ClientsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-10 w-48 rounded-lg bg-slate-200 mb-2" />
        <div className="h-4 w-72 rounded bg-slate-100 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}
