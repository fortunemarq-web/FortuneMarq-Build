import {
  MessageSquare, Clapperboard, Image as ImageIcon, Calendar,
  GalleryHorizontal, CircleDashed, FileText, BarChart2,
  Megaphone, Tag, Package, StickyNote, type LucideIcon,
} from "lucide-react";

/**
 * Lucide icons for content types across the growth pages.
 * Keyed by content_type id — no emoji in UI chrome (see CLAUDE.md).
 */
export const CONTENT_TYPE_ICONS: Record<string, LucideIcon> = {
  post: MessageSquare,
  reel: Clapperboard,
  image: ImageIcon,
  static: ImageIcon,
  event: Calendar,
  carousel: GalleryHorizontal,
  story: CircleDashed,
  article: FileText,
  poll: BarChart2,
  update: Megaphone,
  offer: Tag,
  product: Package,
};

export function getContentTypeIcon(id: string | null | undefined): LucideIcon {
  return (id && CONTENT_TYPE_ICONS[id]) || StickyNote;
}
