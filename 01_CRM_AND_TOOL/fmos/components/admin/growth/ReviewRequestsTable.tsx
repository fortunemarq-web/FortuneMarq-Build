"use client";

import { useState } from "react";
import { Plus, Star, MessageCircle, Mail, X } from "lucide-react";
import { logReviewRequest, updateReviewRequest } from "@/app/admin/growth/actions";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
      <Card className="overflow-hidden flex flex-col">
        <CardHeader className="bg-slate-50">
          <CardTitle>Review Request Tracker</CardTitle>
          <Button onClick={() => setShowModal(true)} variant="secondary" size="sm">
            <Plus className="h-3 w-3" />
            Log Request
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Client</TH>
                <TH>Project / Niche</TH>
                <TH>Date Requested</TH>
                <TH>Method</TH>
                <TH>Received?</TH>
                <TH className="text-right">Rating</TH>
              </TR>
            </THead>
            <TBody>
              {requests.length === 0 ? (
                <TR className="hover:bg-transparent">
                  <TD colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                    No review requests logged yet. Start asking clients!
                  </TD>
                </TR>
              ) : (
                requests.map(r => (
                  <TR key={r.id}>
                    <TD className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">{r.clients?.business_name || 'Unknown'}</span>
                    </TD>
                    <TD className="px-6 py-4">
                      <Badge tone="neutral" size="sm" className="uppercase">
                        {r.clients?.services?.[0] || 'Agency Services'}
                      </Badge>
                    </TD>
                    <TD className="px-6 py-4">
                      <span className="text-sm text-slate-600 tabular-nums">
                        {new Date(r.requested_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </TD>
                    <TD className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        {r.method === 'whatsapp' ? <MessageCircle className="h-3.5 w-3.5 text-brand-deep" /> : <Mail className="h-3.5 w-3.5 text-slate-400" />}
                        <span className="capitalize">{r.method?.replace('_',' ')}</span>
                      </div>
                    </TD>
                    <TD className="px-6 py-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.review_received}
                          onChange={() => handleToggleReceived(r.id, r.review_received)}
                          className="appearance-none h-4 w-4 rounded border-2 border-slate-300 checked:bg-brand checked:border-brand transition-all"
                        />
                        <span className={`ml-2 text-xs font-semibold ${r.review_received ? 'text-brand-deep' : 'text-slate-400'}`}>
                          {r.review_received ? 'Yes' : 'Pending'}
                        </span>
                      </label>
                    </TD>
                    <TD className="px-6 py-4 text-right">
                      {r.review_received ? (
                        <div className="flex items-center justify-end gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <button
                              key={star}
                              onClick={() => handleRatingChange(r.id, star)}
                              className={`${(r.rating || 0) >= star ? 'text-warn' : 'text-slate-800'} hover:text-warn transition-colors cursor-pointer`}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-700">—</span>
                      )}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="font-display text-sm font-semibold text-slate-900">Log Review Request</h3>
              <button onClick={() => setShowModal(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label>Client <span className="text-danger">*</span></Label>
                <Select name="client_id" required>
                  <option value="">Select a client...</option>
                  {activeClients.map(c => (
                    <option key={c.id} value={c.id}>{c.business_name}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Method <span className="text-danger">*</span></Label>
                  <Select name="method" required>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="in_person">In Person</option>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" name="requested_at" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea name="notes" rows={2} placeholder="Promised to leave review by Friday..." />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending} variant="primary" size="lg" className="flex-1">
                  {isPending ? "Logging..." : "Log Request"}
                </Button>
                <Button type="button" onClick={() => setShowModal(false)} variant="secondary" size="lg">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
