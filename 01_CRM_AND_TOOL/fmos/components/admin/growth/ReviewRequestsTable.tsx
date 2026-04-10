"use client";

import { useState } from "react";
import { Plus, Check, Star, MessageCircle, Mail } from "lucide-react";
import { logReviewRequest, updateReviewRequest } from "@/app/admin/growth/actions";

interface Client {
  id: string;
  business_name: string;
  services: string[];
}

export default function ReviewRequestsTable({ requests, activeClients }: { requests: any[], activeClients: Client[] }) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleToggleReceived = async (id: string, current: boolean) => {
    await updateReviewRequest(id, { review_received: !current });
  };

  const handleRatingChange = async (id: string, rating: number) => {
    await updateReviewRequest(id, { rating, review_received: true });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const fd = new FormData(e.currentTarget);
    
    await logReviewRequest({
      client_id: fd.get("client_id") as string,
      requested_at: (fd.get("requested_at") as string) || new Date().toISOString().split("T")[0],
      method: fd.get("method") as string,
      notes: fd.get("notes") as string,
    });
    
    setIsPending(false);
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
            Review Request Tracker
          </h3>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[#42CA80] hover:text-[#42CA80] transition-all min-h-[36px]"
          >
            <Plus className="h-3 w-3" />
            Log Request
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Client</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Project / Niche</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Date Requested</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Method</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Received?</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                    No review requests logged yet. Start asking clients!
                  </td>
                </tr>
              ) : (
                requests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{r.clients?.business_name || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                        {r.clients?.services?.[0] || 'Agency Services'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-mono">
                        {new Date(r.requested_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        {r.method === 'whatsapp' ? <MessageCircle className="h-3.5 w-3.5 text-green-500" /> : <Mail className="h-3.5 w-3.5 text-slate-400" />}
                        <span className="capitalize">{r.method?.replace('_',' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <label className="flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={r.review_received}
                          onChange={() => handleToggleReceived(r.id, r.review_received)}
                          className="appearance-none h-4 w-4 rounded border-2 border-slate-300 checked:bg-[#42CA80] checked:border-[#42CA80] transition-all" 
                        />
                        <span className={`ml-2 text-xs font-bold ${r.review_received ? 'text-[#42CA80]' : 'text-slate-400'}`}>
                          {r.review_received ? 'Yes' : 'Pending'}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.review_received ? (
                        <div className="flex items-center justify-end gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <button
                              key={star}
                              onClick={() => handleRatingChange(r.id, star)}
                              className={`${(r.rating || 0) >= star ? 'text-amber-400' : 'text-slate-200'} hover:text-amber-500 transition-colors cursor-pointer`}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-bold text-slate-900">Log Review Request</h3>
              <button onClick={() => setShowModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><Plus className="h-4 w-4 rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client <span className="text-red-500">*</span></label>
                <select name="client_id" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none min-h-[40px] bg-white">
                  <option value="">Select a client...</option>
                  {activeClients.map(c => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Method <span className="text-red-500">*</span></label>
                  <select name="method" required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none min-h-[40px] bg-white">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" name="requested_at" defaultValue={new Date().toISOString().split("T")[0]} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none" placeholder="Promised to leave review by Friday..."></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-[#42CA80] px-4 py-3 text-sm font-semibold text-white hover:bg-[#38b571] disabled:opacity-50 min-h-[44px]">
                  {isPending ? "Logging..." : "Log Request"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
