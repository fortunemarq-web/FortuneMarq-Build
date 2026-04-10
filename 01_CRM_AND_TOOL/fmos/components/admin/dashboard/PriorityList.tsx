import { createServerClientWithCookies } from "@/lib/supabase-server";
import Link from "next/link";
import { AlertTriangle, Clock, Phone, FileCheck } from "lucide-react";

type PriorityItem = {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  urgency: "overdue" | "today";
  type: "task" | "followup" | "project";
};

async function fetchPriorityItems(): Promise<PriorityItem[]> {
  const supabase = await createServerClientWithCookies();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();
  const tomorrowISO = new Date(today.getTime() + 86400000).toISOString();

  const items: PriorityItem[] = [];

  // 1. Overdue Tasks
  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id, title, due_date")
    .lt("due_date", todayISO)
    .not("status", "in", '("completed","done")')
    .order("due_date", { ascending: true })
    .limit(5);

  for (const t of (overdueTasks ?? []) as any[]) {
    const daysAgo = Math.floor(
      (today.getTime() - new Date(t.due_date).getTime()) / 86400000
    );
    items.push({
      id: `task-overdue-${t.id}`,
      label: t.title,
      sublabel: `Task overdue by ${daysAgo}d`,
      href: "/tasks",
      urgency: "overdue",
      type: "task",
    });
  }

  // 2. Tasks due today
  const { data: todayTasks } = await supabase
    .from("tasks")
    .select("id, title")
    .gte("due_date", todayISO)
    .lt("due_date", tomorrowISO)
    .not("status", "in", '("completed","done")')
    .order("due_date", { ascending: true })
    .limit(4);

  for (const t of (todayTasks ?? []) as any[]) {
    items.push({
      id: `task-today-${t.id}`,
      label: t.title,
      sublabel: "Task due today",
      href: "/tasks",
      urgency: "today",
      type: "task",
    });
  }

  // 3. Overdue Follow-ups (from follow_ups table — status = 'pending', scheduled_at < now)
  const { data: overdueFollowUps } = await supabase
    .from("follow_ups" as any)
    .select("id, follow_up_type, scheduled_at, leads(company_name)")
    .eq("status", "pending")
    .lt("scheduled_at", todayISO)
    .order("scheduled_at", { ascending: true })
    .limit(4);

  for (const f of (overdueFollowUps ?? []) as any[]) {
    const lead = (f as any).leads;
    const companyName = lead?.company_name ?? "Unknown Lead";
    const typeLabel =
      f.follow_up_type === "call"
        ? "📞 Call"
        : f.follow_up_type === "whatsapp"
        ? "💬 WhatsApp"
        : "✉️ Email";
    items.push({
      id: `followup-overdue-${f.id}`,
      label: `${typeLabel} — ${companyName}`,
      sublabel: `Follow-up overdue`,
      href: "/sales",
      urgency: "overdue",
      type: "followup",
    });
  }

  // 4. Follow-ups due today
  const { data: todayFollowUps } = await supabase
    .from("follow_ups" as any)
    .select("id, follow_up_type, scheduled_at, leads(company_name)")
    .eq("status", "pending")
    .gte("scheduled_at", todayISO)
    .lt("scheduled_at", tomorrowISO)
    .order("scheduled_at", { ascending: true })
    .limit(3);

  for (const f of (todayFollowUps ?? []) as any[]) {
    const lead = (f as any).leads;
    const companyName = lead?.company_name ?? "Unknown Lead";
    const typeLabel =
      f.follow_up_type === "call"
        ? "📞 Call"
        : f.follow_up_type === "whatsapp"
        ? "💬 WhatsApp"
        : "✉️ Email";
    const time = new Date(f.scheduled_at).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    items.push({
      id: `followup-today-${f.id}`,
      label: `${typeLabel} — ${companyName}`,
      sublabel: `Today at ${time}`,
      href: "/sales",
      urgency: "today",
      type: "followup",
    });
  }

  // Sort: overdue first, then today
  items.sort((a, b) => {
    if (a.urgency === "overdue" && b.urgency !== "overdue") return -1;
    if (b.urgency === "overdue" && a.urgency !== "overdue") return 1;
    return 0;
  });

  return items.slice(0, 10);
}

const TYPE_ICON: Record<string, React.ElementType> = {
  task: FileCheck,
  followup: Phone,
  project: Clock,
};

export default async function PriorityList() {
  const items = await fetchPriorityItems();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Today's Priority List
        </h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
          {items.length}
        </span>
      </div>

      <div className="p-3 space-y-1 max-h-[400px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-medium text-slate-600">All clear!</p>
            <p className="text-xs text-slate-400 mt-0.5">
              No overdue tasks or follow-ups
            </p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = TYPE_ICON[item.type] ?? Clock;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-slate-50 group min-h-[44px]"
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    item.urgency === "overdue"
                      ? "bg-red-50 text-red-500"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-slate-900">
                    {item.label}
                  </p>
                  <p
                    className={`text-[10px] font-medium mt-0.5 ${
                      item.urgency === "overdue"
                        ? "text-red-500"
                        : "text-slate-400"
                    }`}
                  >
                    {item.sublabel}
                  </p>
                </div>
                {item.urgency === "overdue" && (
                  <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">
                    Overdue
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>

      {items.length === 10 && (
        <div className="border-t border-slate-100 px-5 py-3">
          <Link
            href="/tasks"
            className="text-xs font-medium text-[#42CA80] hover:text-emerald-700 transition-colors"
          >
            View all tasks →
          </Link>
        </div>
      )}
    </div>
  );
}
