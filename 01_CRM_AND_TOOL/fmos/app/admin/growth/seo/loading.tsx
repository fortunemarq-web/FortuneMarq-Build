export default function SeoLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 animate-pulse">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="h-10 w-64 bg-slate-200 rounded-lg" />
          <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[400px] w-full bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
