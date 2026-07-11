import { createServerClientWithCookies } from "@/lib/supabase-server";
import { Plus, Search, FileText } from "lucide-react";
import Link from "next/link";
import SopCard from "@/components/team/sop-card";
import clsx from "clsx";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-full bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          eyebrow="Team"
          title="SOP Library"
          subtitle="Standard Operating Procedures for consistent agency delivery."
          actions={
            <Link href="/admin/team/sops/new" className={buttonVariants({ variant: "primary" })}>
              <Plus className="h-4 w-4" />
              Create SOP
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Categories Sidebar */}
          <div className="space-y-4">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</h2>
            <div className="flex flex-col gap-1">
              <Link
                href="/admin/team/sops"
                className={clsx(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  !selectedCategory
                    ? "border-line bg-surface text-slate-900"
                    : "border-transparent text-slate-500 hover:bg-surface hover:text-slate-900"
                )}
              >
                All SOPs
              </Link>
              {CATEGORIES.map(cat => (
                <Link
                  key={cat}
                  href={`/admin/team/sops?category=${encodeURIComponent(cat)}`}
                  className={clsx(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    selectedCategory === cat
                      ? "border-line bg-surface text-slate-900"
                      : "border-transparent text-slate-500 hover:bg-surface hover:text-slate-900"
                  )}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Main Library Area */}
          <div className="space-y-6 lg:col-span-3">
            <form method="GET" action="/admin/team/sops" className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    type="text"
                    name="search"
                    defaultValue={searchQuery || ""}
                    placeholder="Search templates, scripts, or instructions..."
                    className="pl-10"
                />
                {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
            </form>

            {error ? (
                <div className="p-8 text-danger">Error: {error.message}</div>
            ) : sops?.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-slate-50/60 py-20 text-center">
                    <FileText className="mx-auto mb-4 h-10 w-10 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-500">No procedures found in this category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

