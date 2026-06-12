import { createServerClientWithCookies } from "@/lib/supabase-server";
import { BookOpen, Plus, Search, Filter, FileText, Clock } from "lucide-react";
import Link from "next/link";
import SopCard from "@/components/team/sop-card";
import clsx from "clsx";

const CATEGORIES = [
  "Sales & Outreach",
  "Website Delivery",
  "Client Onboarding",
  "Monthly Reporting",
  "Social Media",
  "Finance"
];

export default async function SopLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const supabase = await createServerClientWithCookies();
  const resolvedParams = await searchParams;
  const selectedCategory = resolvedParams.category;
  const searchQuery = resolvedParams.search;

  let query = supabase.from("sops").select("*").order("updated_at", { ascending: false });

  if (selectedCategory) {
    query = query.eq("category", selectedCategory);
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data: sops, error } = await query;

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
              <BookOpen className="h-10 w-10 text-emerald-500" />
              SOP Library
            </h1>
            <p className="text-slate-500 font-medium">Standard Operating Procedures for consistent agency delivery.</p>
          </div>
          
          <Link 
            href="/admin/team/sops/new"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
          >
            <Plus className="h-4 w-4" />
            Create SOP
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Categories</h2>
            <div className="flex flex-col gap-1">
              <Link 
                href="/admin/team/sops"
                className={clsx(
                  "px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                  !selectedCategory 
                    ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
                    : "border-transparent text-slate-500 hover:bg-white hover:border-slate-100 hover:text-slate-900"
                )}
              >
                All SOPs
              </Link>
              {CATEGORIES.map(cat => (
                <Link 
                  key={cat}
                  href={`/admin/team/sops?category=${encodeURIComponent(cat)}`}
                  className={clsx(
                    "px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                    selectedCategory === cat 
                      ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
                      : "border-transparent text-slate-500 hover:bg-white hover:border-slate-100 hover:text-slate-900"
                  )}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Main Library Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <form method="GET" action="/admin/team/sops" className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        type="text" 
                        name="search"
                        defaultValue={searchQuery || ""}
                        placeholder="Search templates, scripts, or instructions..."
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                    />
                    {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
                </form>
                <button className="flex items-center gap-2 px-4 py-4 rounded-2xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            {error ? (
                <div className="p-8 text-red-500">Error: {error.message}</div>
            ) : sops?.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <FileText className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest">No procedures found in this category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sops?.map((sop: any) => (
                        <SopCard key={sop.id} sop={sop} />
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

