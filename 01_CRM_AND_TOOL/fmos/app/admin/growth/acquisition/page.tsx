import { redirect } from "next/navigation";

// Standalone acquisition page — lives as a tab inside /admin/growth.
// Old URL kept as a redirect so bookmarks/links don't break.
export default function RedirectPage() {
  redirect("/admin/growth?tab=acquisition");
}
