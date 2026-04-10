"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Eye, Package, Heart, Zap } from "lucide-react";
import Link from "next/link";
import type { ClientRecord } from "@/app/admin/clients/actions";
import HealthScoreStars from "./HealthScoreStars";
import ServicePills from "./ServicePills";
import PackageModal from "@/app/admin/clients/package-modal";
import HealthScoreModal from "@/app/admin/clients/health-score-modal";
import UpsellAttemptModal from "@/app/admin/clients/upsell-attempt-modal";

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

  const filtered = useMemo(() => {
    let result = clients;

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
  }, [clients, search, statusFilter, packageFilter, healthFilter, sortField, sortDir]);

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
    if (days <= 30) return "text-red-600 font-semibold";
    if (days <= 60) return "text-amber-600 font-medium";
    return "text-slate-600";
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paused: "bg-amber-50 text-amber-700 border-amber-200",
      churned: "bg-red-50 text-red-700 border-red-200",
    };
    return map[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
  };

  const getHealthBadge = (score: number | null) => {
    if (score == null) return { text: "—", color: "text-slate-400 bg-slate-50" };
    if (score >= 80) return { text: String(score), color: "text-green-700 bg-green-100" };
    if (score >= 60) return { text: String(score), color: "text-blue-700 bg-blue-100" };
    if (score >= 40) return { text: String(score), color: "text-amber-700 bg-amber-100" };
    return { text: String(score), color: "text-red-700 bg-red-100" };
  };

  const tierColors: Record<string, string> = {
    starter: "bg-blue-50 text-blue-700 border-blue-200",
    growth: "bg-indigo-50 text-indigo-700 border-indigo-200",
    pro: "bg-emerald-50 text-emerald-700 border-emerald-200",
    custom: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div>
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="font-medium">Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#42CA80] focus:outline-none min-h-[36px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="churned">Churned</option>
          </select>
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#42CA80] focus:outline-none min-h-[36px]"
          >
            <option value="all">All Packages</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
            <option value="custom">Custom</option>
          </select>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#42CA80] focus:outline-none min-h-[36px]"
          >
            <option value="all">Health</option>
            <option value="80">Healthy (80+)</option>
            <option value="60">Stable (60-79)</option>
            <option value="40">At Risk (40-59)</option>
            <option value="0">Critical (&lt;40)</option>
          </select>

          <span className="text-xs text-slate-400 ml-2">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <SortHeader label="Client" field="business_name" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Package</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 min-w-[180px]">Services</th>
              <SortHeader label="MRR" field="monthly_value" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Health" field="health_score" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <SortHeader label="Renewal" field="renewal_date" current={sortField} dir={sortDir} onToggle={toggleSort} />
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                  No clients match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const healthBadge = getHealthBadge(c.health_score ?? null);
                const mrr = c.monthly_value ?? 0;
                const tier = c.package_tier || "starter";
                const services = c.services_active || [];

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className="font-semibold text-slate-900 hover:text-[#42CA80] transition-colors truncate max-w-[150px] inline-block"
                        >
                          {c.business_name}
                        </Link>
                        {c.upsell_eligible && (
                          <span title="Upsell Opportunity" className="flex shrink-0 h-4 w-4 bg-orange-100 text-orange-600 rounded-full items-center justify-center">
                            <Zap className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.city ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex border px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${tierColors[tier]}`}>
                        {tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {services.length > 0 ? services.map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200 truncate max-w-[80px]" title={s}>
                            {s}
                          </span>
                        )) : (
                          <span className="text-[10px] text-slate-400 italic">No services</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      ₹{mrr.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex flex-col items-center justify-center h-[26px] min-w-[26px] rounded-full text-[11px] font-bold ${healthBadge.color}`}>
                        {healthBadge.text}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${renewalClass(c.renewal_date)}`}>
                      {c.renewal_date
                        ? new Date(c.renewal_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded flex-col px-2 py-1 text-[9px] font-bold uppercase tracking-widest border ${statusBadge(c.status || "active")}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openModal(c, "package")}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#42CA80] hover:text-[#42CA80] transition-colors"
                          title="Manage Package"
                        >
                          <Package className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openModal(c, "health")}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-red-400 hover:text-red-500 transition-colors"
                          title="Update Health"
                        >
                          <Heart className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/admin/clients/${c.id}`}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => onToggle(field)}
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? "text-[#42CA80]" : "opacity-30"}`}
        />
        {isActive && (
          <span className="text-[8px] text-[#42CA80]">
            {dir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </button>
    </th>
  );
}
