"use client";

import { useState, useTransition } from "react";
import { X, Calendar as CalendarIcon, Loader2, Save, BarChart3, Image as ImageIcon, Trash2 } from "lucide-react";
import { upsertContentPiece, deleteContentPiece, ContentPiece } from "@/app/admin/growth/actions";
import { toast } from "@/components/ui/toast";
import { promptModal } from "@/components/ui/prompt-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ContentPostModalProps {
  post: Partial<ContentPiece>;
  channel: string;
  onClose: () => void;
  onSave: (savedPost: ContentPiece) => void;
  onDelete?: (id: string) => void;
  availableTypes: { id: string; label: string; icon?: string }[];
}

export default function ContentPostModal({ post, channel, onClose, onSave, onDelete, availableTypes }: ContentPostModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!post.id) return;
    const ok = await promptModal({ title: `Delete "${post.title || "this post"}"?`, description: "This can't be undone.", confirmLabel: "Delete", destructive: true, type: "select", options: [{ value: "confirm", label: "Yes, delete" }] });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteContentPiece(post.id!, channel);
      if (result.success) {
        toast.success("Post deleted");
        onDelete?.(post.id!);
        onClose();
      } else {
        toast.error("Could not delete post", result.error ?? "");
      }
    });
  };

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
        toast.error("Failed to save post", result.error ?? "");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-t-2xl border border-line bg-surface shadow-lg sm:rounded-2xl flex flex-col max-h-[90vh]">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-6 py-4 bg-slate-50 rounded-t-2xl">
          <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
            {post.id ? "Edit Post" : "New Post"}
            <Badge tone="neutral" size="sm" className="uppercase">
              {channel}
            </Badge>
          </h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Title / Topic <span className="text-danger">*</span></Label>
              <Input required name="title" defaultValue={post.title} placeholder="e.g. 5 SEO Tips for Local Businesses" />
            </div>

            <div>
              <Label>Content Type</Label>
              <Select name="content_type" defaultValue={post.content_type || availableTypes[0]?.id}>
                {availableTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue={post.status || "idea"}>
                <option value="idea">Idea</option>
                <option value="drafted">Drafted</option>
                <option value="ready">Ready</option>
                <option value="published">Published</option>
              </Select>
            </div>

            <div>
              <Label>Scheduled Date</Label>
              <div className="relative">
                <Input type="date" name="scheduled_date" defaultValue={post.scheduled_date ? post.scheduled_date.split("T")[0] : ""} className="pl-9" />
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <Label>Caption Draft / Body</Label>
            <Textarea name="caption_draft" rows={4} defaultValue={post.caption_draft || ""} placeholder="Write your post caption here..." />
          </div>

          {channel === 'gmb' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-line">
              <div className="col-span-2">
                <Label>Image Prompt (AI Gen)</Label>
                <div className="relative">
                  <Input name="image_prompt" defaultValue={post.image_prompt || ""} className="pl-9" placeholder="Describe the image you want for this post..." />
                  <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div>
                <Label>CTA Type</Label>
                <Select name="cta_type" defaultValue={post.cta_type || "Learn More"}>
                  <option value="Book">Book</option>
                  <option value="Call">Call</option>
                  <option value="Learn More">Learn More</option>
                  <option value="Order">Order</option>
                  <option value="Shop">Shop</option>
                  <option value="Sign Up">Sign Up</option>
                </Select>
              </div>
              <div>
                <Label>CTA URL</Label>
                <Input name="cta_url" defaultValue={post.cta_url || ""} placeholder="https://..." />
              </div>
            </div>
          )}

          {post.status === "published" && (
            <div className="p-4 rounded-xl border border-brand-line bg-brand-soft">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-brand-deep" />
                <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-deep">Performance Metrics</h4>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {['reach', 'likes', 'comments', 'shares', 'saves'].map(metric => (
                  <div key={metric}>
                    <Label className="text-[11px] uppercase text-brand-deep">{metric}</Label>
                    <Input type="number" name={metric} defaultValue={(post as any)[metric] || 0} className="h-8 text-xs tabular-nums" />
                  </div>
                ))}
              </div>
              {post.engagement_rate !== undefined && (
                <div className="mt-3 pt-3 border-t border-brand-line flex justify-between items-center text-xs">
                  <span className="text-brand-deep font-medium">Engagement Rate:</span>
                  <span className="font-semibold tabular-nums text-brand-deep">{post.engagement_rate}%</span>
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Internal Notes</Label>
            <Textarea name="notes" rows={2} defaultValue={post.notes || ""} placeholder="Hashtags to use, references..." />
          </div>

          <div className="flex gap-3 pt-4 border-t border-line">
            {post.id && (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                title="Delete post"
                variant="danger-soft"
                size="lg"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending}
              variant="primary"
              size="lg"
              className="flex-1"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {post.id ? "Save Changes" : "Create Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
