export default function GmbLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 animate-pulse">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-4 w-24 bg-slate-200 rounded mb-4" />
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="h-10 w-64 bg-slate-200 rounded-lg" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl" />)}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] bg-white border border-slate-200 rounded-xl" />
          <div className="h-[500px] bg-white border border-slate-200 rounded-xl" />
        </div>
        
        <div className="h-[400px] bg-white border border-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
