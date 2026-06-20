"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpDown, Eye, Package, Heart, Zap, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ClientRecord } from "@/app/admin/clients/actions";
import { updateClientField, deleteClient } from "@/app/admin/clients/actions";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import HealthScoreStars from "./HealthScoreStars";
import ServicePills from "./ServicePills";
import PackageModal from "@/app/admin/clients/package-modal";
import HealthScoreModal from "@/app/admin/clients/health-score-modal";
import UpsellAttemptModal from "@/app/admin/clients/upsell-attempt-modal";
import { Badge, type Tone } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

type SortField = "monthly_value" | "health_score" | "start_date" | "renewal_date" | "business_name";
type SortDir = "asc" | "desc";

export default function ClientsTable({
  clients,
  upsellAttempts = [],
}: {
  clients: ClientRecord[];
  upsellAttempts?: any[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("business_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<"package" | "health" | "upsell" | null>(null);

  const openModal = (client: ClientRecord, modal: "package" | "health" | "upsell") => {
    setSelectedClient(client);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setSelectedClient(null);
    setActiveModal(null);
  };

  const router = useRouter();
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const changeStatus = async (c: ClientRecord, status: string) => {
    const prev = localStatus[c.id] ?? c.status ?? "active";
    setLocalStatus((m) => ({ ...m, [c.id]: status }));
    const res = await updateClientField(c.id, "status", status);
    if (!res.success) {
      setLocalStatus((m) => ({ ...m, [c.id]: prev }));
      toast.error("Could not update status", res.error ?? "");
      return;
    }
    toast.success(`${c.business_name} marked ${status}`);
    router.refresh();
  };

  const handleDelete = async (c: ClientRecord) => {
    const ok = await promptModal({ title: `Delete ${c.business_name}?`, description: "This removes all their package and onboarding data permanently. If they're leaving, mark them Churned instead so finance history stays intact.", confirmLabel: "Delete Client", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete permanently" }] });
    if (!ok) return;
    const res = await deleteClient(c.id);
    if (!res.success) {
      toast.error("Could not delete client", res.error ?? "");
      return;
    }
    setDeletedIds((s) => new Set(s).add(c.id));
    toast.success("Client deleted", c.business_name);
    router.refresh();
  };

  const filtered = useMemo(() => {
    let result = clients.filter((c) => !deletedIds.has(c.id));

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.business_name?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.niche?.toLowerCase().includes(q) ||
          c.owner_name?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Package Tier filter
    if (packageFilter !== "all") {
      result = result.filter((c) => (c.package_tier || "starter") === packageFilter);
    }

    // Health filter
    if (healthFilter !== "all") {
      const h = parseInt(healthFilter);
      result = result.filter((c) => {
        const score = c.health_score ?? 0;
        if (h === 80) return score >= 80;
        if (h === 60) return score >= 60 && score < 80;
        if (h === 40) return score >= 40 && score < 60;
        return score < 40;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case "monthly_value":
          aVal = a.monthly_value ?? 0;
          bVal = b.monthly_value ?? 0;
          break;
        case "health_score":
          aVal = a.health_score ?? 0;
          bVal = b.health_score ?? 0;
          break;
        case "start_date":
          aVal = a.start_date ?? "";
          bVal = b.start_date ?? "";
          break;
        case "renewal_date":
          aVal = a.renewal_date ?? "9999-12-31";
          bVal = b.renewal_date ?? "9999-12-31";
          break;
        default:
          aVal = a.business_name?.toLowerCase() ?? "";
          bVal = b.business_name?.toLowerCase() ?? "";
      }

      if ((aVal || "") < (bVal || "")) return sortDir === "asc" ? -1 : 1;
      if ((aVal || "") > (bVal || "")) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, search, statusFilter, packageFilter, healthFilter, sortField, sortDir, deletedIds]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const renewalClass = (date: string | null) => {
    if (!date) return "text-slate-400";
    const days = Math.floor(
      (new Date(date).getTime() - Date.now()) / 86400000
    );
    if (days <= 30) return "text-danger font-semibold";
    if (days <= 60) return "text-warn font-medium";
    return "text-slate-600";
  };

  const getHealthBadge = (score: number | null): { text: string; tone: Tone } => {
    if (score == null) return { text: "—", tone: "neutral" };
    if (score >= 80) return { text: String(score), tone: "brand" };
    if (score >= 60) return { text: String(score), tone: "info" };
    if (score >= 40) return { text: String(score), tone: "warning" };
    return { text: String(score), tone: "danger" };
  };

  return (
    <div>
      {/* Filters Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="font-medium">Filter:</span>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="churned">Churned</option>
          </Select>
          <Select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="h-8 w-auto"
          >
            <option value="all">All Packages</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
            <option value="custom">Custom</option>
          </Select>
          <Select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="h-8 w-auto"
          >
            <option value="all">Health</option>
            <option value="80">Healthy (80+)</option>
            <option value="60">Stable (60-79)</option>
            <option value="40">At Risk (40-59)</option>
            <option value="0">Critical (&lt;40)</option>
          </Select>

          <span className="ml-2 text-xs text-slate-400">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <Table className="min-w-[1000px]">
          <THead>
            <TR className="hover:bg-transparent">
              <SortHeader label="Client" field="business_name" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <TH>Package</TH>
              <TH className="min-w-[180px]">Services</TH>
              <SortHeader label="MRR" field="monthly_value" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Health" field="health_score" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Renewal" field="renewal_date" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.length === 0 ? (
              <TR className="hover:bg-transparent">
                <TD colSpan={8} className="py-12 text-center text-sm text-slate-400">
                  No clients match your filters.
                </TD>
              </TR>
            ) : (
              filtered.map((c) => {
                const healthBadge = getHealthBadge(c.health_score ?? null);
                const mrr = c.monthly_value ?? 0;
                const tier = c.package_tier || "starter";
                const services = c.services_active || [];

                return (
                  <TR key={c.id}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className="inline-block max-w-[150px] truncate font-semibold text-slate-900 transition-colors hover:text-brand-deep"
                        >
                          {c.business_name}
                        </Link>
                        {c.upsell_eligible && (
                          <span title="Upsell Opportunity" className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                            <Zap className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">{c.city ?? "—"}</p>
                    </TD>
                    <TD>
                      <Badge tone="neutral" variant="outline" size="sm" className="uppercase">
                        {tier}
                      </Badge>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {services.length > 0 ? services.map(s => (
                          <Badge key={s} tone="neutral" variant="outline" size="sm" className="max-w-[80px] truncate" title={s}>
                            {s}
                          </Badge>
                        )) : (
                          <span className="text-[11px] italic text-slate-400">No services</span>
                        )}
                      </div>
                    </TD>
                    <TD className="font-semibold tabular-nums text-slate-800">
                      ₹{mrr.toLocaleString("en-IN")}
                    </TD>
                    <TD>
                      <Badge tone={healthBadge.tone} size="sm" className="tabular-nums">
                        {healthBadge.text}
                      </Badge>
                    </TD>
                    <TD className={`text-xs ${renewalClass(c.renewal_date)}`}>
                      {c.renewal_date
                        ? new Date(c.renewal_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                        : "—"}
                    </TD>
                    <TD>
                      <Select
                        value={localStatus[c.id] ?? c.status ?? "active"}
                        onChange={(e) => changeStatus(c, e.target.value)}
                        title="Change status"
                        className="h-8 w-auto text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="paused">Paused</option>
                        <option value="churned">Churned</option>
                      </Select>
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal(c, "package")}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-slate-500 transition-colors hover:border-brand-deep hover:text-brand-deep"
                          title="Manage Package"
                        >
                          <Package className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openModal(c, "health")}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-slate-500 transition-colors hover:border-danger-line hover:text-danger"
                          title="Update Health"
                        >
                          <Heart className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className={buttonVariants({ variant: "primary", size: "icon", className: "h-7 w-7" })}
                          title="View Profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface text-slate-300 transition-colors hover:border-danger-line hover:text-danger"
                          title="Delete Client"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>
      </div>

      {/* Modals */}
      {selectedClient && activeModal === "package" && (
        <PackageModal client={selectedClient} onClose={closeModal} />
      )}
      {selectedClient && activeModal === "health" && (
        <HealthScoreModal client={selectedClient} onClose={closeModal} />
      )}
      {selectedClient && activeModal === "upsell" && (
        <UpsellAttemptModal client={selectedClient} onClose={closeModal} />
      )}
    </div>
  );
}

// ── Sortable Header ─────────────────────────────────────────
function SortHeader({
  label,
  field,
  current,
  dir,
  onToggle,
}: {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onToggle: (f: SortField) => void;
}) {
  const isActive = current === field;
  return (
    <TH className="p-0">
      <button
        onClick={() => onToggle(field)}
        className="flex items-center gap-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? "text-brand-deep" : "opacity-30"}`}
        />
        {isActive && (
          <span className="text-[11px] text-brand-deep">
            {dir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </TH>
  );
}
