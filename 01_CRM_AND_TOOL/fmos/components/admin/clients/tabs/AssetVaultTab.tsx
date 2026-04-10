"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Key,
  Image,
  Link as LinkIcon,
  Loader2,
  X,
} from "lucide-react";
import {
  addClientAsset,
  deleteClientAsset,
} from "@/app/admin/clients/actions";
import { useRouter } from "next/navigation";

interface Asset {
  id: string;
  category: string;
  label: string;
  username: string | null;
  password_encrypted: string | null;
  url: string | null;
  file_url: string | null;
  file_type: string | null;
  link_url: string | null;
  notes: string | null;
  created_at: string | null;
}

const CATEGORY_CONFIG = {
  credentials: {
    label: "Credentials",
    icon: Key,
    color: "border-amber-200 bg-amber-50/50",
  },
  brand_assets: {
    label: "Brand Assets",
    icon: Image,
    color: "border-blue-200 bg-blue-50/50",
  },
  links: {
    label: "Important Links",
    icon: LinkIcon,
    color: "border-purple-200 bg-purple-50/50",
  },
};

export default function AssetVaultTab({
  assets: initialAssets,
  clientId,
}: {
  assets: Asset[];
  clientId: string;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<Asset["category"]>("credentials");
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const grouped = {
    credentials: assets.filter((a) => a.category === "credentials"),
    brand_assets: assets.filter((a) => a.category === "brand_assets"),
    links: assets.filter((a) => a.category === "links"),
  };

  const toggleReveal = (id: string) => {
    setRevealedPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (assetId: string) => {
    if (!confirm("Delete this asset?")) return;
    setDeletingId(assetId);
    startTransition(async () => {
      const result = await deleteClientAsset(assetId, clientId);
      if (result.success) {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
      }
      setDeletingId(null);
    });
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addClientAsset({
        client_id: clientId,
        category: addCategory as "credentials" | "brand_assets" | "links",
        label: fd.get("label") as string,
        username: (fd.get("username") as string) || undefined,
        // Passwords stored plaintext — admin-only RLS enforced.
        // Upgrade to pgp_sym_encrypt in future security pass.
        password_encrypted: (fd.get("password") as string) || undefined,
        url: (fd.get("url") as string) || undefined,
        file_url: (fd.get("file_url") as string) || undefined,
        file_type: (fd.get("file_type") as string) || undefined,
        link_url: (fd.get("link_url") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });

      if (result.success) {
        setShowAddModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          Secure storage for credentials, brand assets, and important links
        </p>
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_CONFIG) as Asset["category"][]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setAddCategory(cat);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 transition-all min-h-[36px]"
            >
              <Plus className="h-3 w-3" />
              {CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG].label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Sections */}
      {(Object.entries(CATEGORY_CONFIG) as [Asset["category"], typeof CATEGORY_CONFIG["credentials"]][]).map(
        ([cat, cfg]) => {
          const Icon = cfg.icon;
          const catAssets = (grouped as any)[cat];
          return (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {cfg.label}
                </h3>
                <span className="text-[10px] text-slate-400">
                  ({catAssets.length})
                </span>
              </div>

              {catAssets.length === 0 ? (
                <div className={`rounded-xl border ${cfg.color} p-6 text-center`}>
                  <p className="text-sm text-slate-400">No {cfg.label.toLowerCase()} added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {catAssets.map((asset: Asset) => (
                    <div
                      key={asset.id}
                      className={`rounded-xl border ${cfg.color} p-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {asset.label}
                          </p>

                          {cat === "credentials" && (
                            <div className="mt-2 space-y-1">
                              {asset.username && (
                                <p className="text-xs text-slate-600">
                                  <span className="text-slate-400">User:</span>{" "}
                                  <span className="font-mono">{asset.username}</span>
                                </p>
                              )}
                              {asset.password_encrypted && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">Pass:</span>
                                  <span className="text-xs font-mono text-slate-600">
                                    {revealedPasswords.has(asset.id)
                                      ? asset.password_encrypted
                                      : "••••••••"}
                                  </span>
                                  <button
                                    onClick={() => toggleReveal(asset.id)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                  >
                                    {revealedPasswords.has(asset.id) ? (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}
                              {asset.url && (
                                <p className="text-xs text-slate-500 truncate">
                                  <span className="text-slate-400">URL:</span>{" "}
                                  <a href={asset.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    {asset.url}
                                  </a>
                                </p>
                              )}
                            </div>
                          )}

                          {cat === "brand_assets" && (
                            <div className="mt-2 space-y-1">
                              {asset.file_type && (
                                <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                                  {asset.file_type}
                                </span>
                              )}
                              {asset.file_url && (
                                <p className="text-xs">
                                  <a href={asset.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    Download / View
                                  </a>
                                </p>
                              )}
                            </div>
                          )}

                          {cat === "links" && asset.link_url && (
                            <p className="mt-2 text-xs truncate">
                              <a href={asset.link_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                {asset.link_url}
                              </a>
                            </p>
                          )}

                          {asset.notes && (
                            <p className="mt-1.5 text-xs text-slate-400 italic">
                              {asset.notes}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(asset.id)}
                          disabled={deletingId === asset.id}
                          className="flex-shrink-0 rounded-lg p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all min-h-[36px]"
                        >
                          {deletingId === asset.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">
                Add {CATEGORY_CONFIG[addCategory as keyof typeof CATEGORY_CONFIG].label}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  name="label"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20"
                  placeholder={addCategory === "credentials" ? "e.g. cPanel Login" : addCategory === "brand_assets" ? "e.g. Logo SVG" : "e.g. GMB Profile"}
                />
              </div>

              {addCategory === "credentials" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                    <input name="username" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <input name="password" type="text" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="Stored securely with admin-only access" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">URL</label>
                    <input name="url" type="url" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="https://..." />
                  </div>
                </>
              )}

              {addCategory === "brand_assets" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">File Type</label>
                    <select name="file_type" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none min-h-[40px]">
                      <option value="logo">Logo</option>
                      <option value="photo">Photo</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      File URL or Supabase Storage path
                    </label>
                    <input name="file_url" type="url" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="https://..." />
                    <p className="mt-1 text-[10px] text-slate-400">
                      Upload file to Supabase Storage first, then paste the URL here.
                    </p>
                  </div>
                </>
              )}

              {addCategory === "links" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL</label>
                  <input name="link_url" type="url" required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="https://..." />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input name="notes" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#42CA80] focus:outline-none focus:ring-2 focus:ring-[#42CA80]/20" placeholder="Optional notes..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-[#42CA80] px-4 py-3 text-sm font-semibold text-white hover:bg-[#38b571] disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
