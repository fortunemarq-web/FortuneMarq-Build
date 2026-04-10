"use client";

import { useState, useTransition } from "react";
import { X, Calendar as CalendarIcon, Loader2, Save, BarChart3, Image as ImageIcon } from "lucide-react";
import { upsertContentPiece, ContentPiece } from "@/app/admin/growth/actions";

interface ContentPostModalProps {
  post: Partial<ContentPiece>;
  channel: string;
  onClose: () => void;
  onSave: (savedPost: ContentPiece) => void;
  availableTypes: { id: string; label: string; icon: string }[];
}

export default function ContentPostModal({ post, channel, onClose, onSave, availableTypes }: ContentPostModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    // Check if moving to published without a published_date
    const status = fd.get("status") as string;
    let publishedDate = post.published_date;
    if (status === "published" && !publishedDate) {
      publishedDate = new Date().toISOString();
    }
    
    startTransition(async () => {
      const payload: Partial<ContentPiece> = {
        id: post.id,
        channel,
        title: fd.get("title") as string,
        content_type: fd.get("content_type") as string,
        platform: channel,
        status: status,
        caption_draft: fd.get("caption_draft") as string,
        scheduled_date: fd.get("scheduled_date") ? (fd.get("scheduled_date") as string) : null,
        published_date: publishedDate,
        image_prompt: fd.get("image_prompt") as string,
        notes: fd.get("notes") as string,
        reach: parseInt(fd.get("reach") as string) || 0,
        likes: parseInt(fd.get("likes") as string) || 0,
        comments: parseInt(fd.get("comments") as string) || 0,
        shares: parseInt(fd.get("shares") as string) || 0,
        saves: parseInt(fd.get("saves") as string) || 0,
        cta_type: fd.get("cta_type") as string,
        cta_url: fd.get("cta_url") as string,
      };

      const result = await upsertContentPiece(payload);
      if (result.success && result.data) {
        onSave(result.data as ContentPiece);
        onClose();
      } else {
        alert("Failed to save post");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 rounded-t-2xl">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {post.id ? "Edit Post" : "New Post"}
            <span className="inline-flex rounded bg-slate-200 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-700 tracking-wide">
              {channel}
            </span>
          </h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Topic <span className="text-red-500">*</span></label>
              <input required name="title" defaultValue={post.title} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none" placeholder="e.g. 5 SEO Tips for Local Businesses" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Content Type</label>
              <select name="content_type" defaultValue={post.content_type || availableTypes[0]?.id} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none min-h-[38px] bg-white">
                {availableTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select name="status" defaultValue={post.status || "idea"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none min-h-[38px] bg-white">
                <option value="idea">Idea 💡</option>
                <option value="drafted">Drafted 📝</option>
                <option value="ready">Ready ✅</option>
                <option value="published">Published 🚀</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date</label>
              <div className="relative">
                <input type="date" name="scheduled_date" defaultValue={post.scheduled_date ? post.scheduled_date.split("T")[0] : ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-sm focus:border-[#42CA80] focus:outline-none" />
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Caption Draft / Body</label>
            <textarea name="caption_draft" rows={4} defaultValue={post.caption_draft || ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none resize-y" placeholder="Write your post caption here..." />
          </div>

          {channel === 'gmb' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image Prompt (AI Gen)</label>
                <div className="relative">
                  <input name="image_prompt" defaultValue={post.image_prompt || ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-sm focus:border-[#42CA80] focus:outline-none" placeholder="Describe the image you want for this post..." />
                  <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CTA Type</label>
                <select name="cta_type" defaultValue={post.cta_type || "Learn More"} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none bg-white">
                  <option value="Book">Book</option>
                  <option value="Call">Call</option>
                  <option value="Learn More">Learn More</option>
                  <option value="Order">Order</option>
                  <option value="Shop">Shop</option>
                  <option value="Sign Up">Sign Up</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CTA URL</label>
                <input name="cta_url" defaultValue={post.cta_url || ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none" placeholder="https://..." />
              </div>
            </div>
          )}

          {post.status === "published" && (
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800">Performance Metrics</h4>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {['reach', 'likes', 'comments', 'shares', 'saves'].map(metric => (
                  <div key={metric}>
                    <label className="block text-[10px] font-bold uppercase text-emerald-700 opacity-70 mb-1">{metric}</label>
                    <input type="number" name={metric} defaultValue={(post as any)[metric] || 0} className="w-full rounded border border-emerald-200 px-2 py-1 text-xs font-mono focus:border-emerald-400 focus:outline-none bg-white" />
                  </div>
                ))}
              </div>
              {post.engagement_rate !== undefined && (
                <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-medium">Engagement Rate:</span>
                  <span className="font-bold text-emerald-800">{post.engagement_rate}%</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea name="notes" rows={2} defaultValue={post.notes || ""} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#42CA80] focus:outline-none resize-y" placeholder="Hashtags to use, references..." />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#42CA80] px-4 py-3 text-sm font-semibold text-white hover:bg-[#38b571] disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {post.id ? "Save Changes" : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
