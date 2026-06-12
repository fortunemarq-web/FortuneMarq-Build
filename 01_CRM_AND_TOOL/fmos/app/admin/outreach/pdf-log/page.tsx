import { createServerClientWithCookies } from "@/lib/supabase-server";
import PdfLogClient from "./pdf-log-client";

export const revalidate = 60;

export default async function PdfLogPage() {
  const supabase = await createServerClientWithCookies();

  // Fetch all PDF delivery records from outreach_logs
  const { data: pdfLogs, error } = await supabase
    .from("outreach_logs")
    .select("id, created_at, pdf_name, lead_id, actor_id")
    .eq("touch_type", "pdf_sent")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50">
        <p className="text-red-500">Error loading PDF log: {error.message}</p>
      </div>
    );
  }

  return <PdfLogClient logs={(pdfLogs || []) as any[]} />;
}
