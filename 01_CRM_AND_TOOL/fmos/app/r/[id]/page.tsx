import { createAdminClient } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import RescheduleForm from "./reschedule-form";

export const dynamic = "force-dynamic";

const IST = "Asia/Kolkata";
function fmtWhen(iso: string | null): string {
  if (!iso) return "your upcoming call";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "your upcoming call";
  return d.toLocaleString("en-IN", {
    timeZone: IST, weekday: "long", day: "numeric", month: "long",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

// Public self-serve reschedule page. The link (/r/<leadId>) is sent in the
// meeting reminder + no-show WhatsApp templates. The id is the lead's UUID —
// unguessable enough for this low-stakes flow.
export default async function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, company_name, contact_person, follow_up_date, outreach_stage")
    .eq("id", id)
    .maybeSingle();

  if (!lead) notFound();

  const name = (lead as any).contact_person || (lead as any).company_name || "there";
  const currentWhen = fmtWhen((lead as any).follow_up_date);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-sm border border-gray-100 p-7">
        <div className="mb-6">
          <p className="text-sm font-semibold text-brand-deep">FortuneMarq</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Reschedule your call</h1>
          <p className="text-sm text-gray-500 mt-2">
            Hi {name}! Your call is currently set for <span className="font-medium text-gray-700">{currentWhen}</span>.
            Pick a new time that works better and we&apos;ll update it.
          </p>
        </div>
        <RescheduleForm leadId={(lead as any).id} />
      </div>
    </div>
  );
}
