import { redirect } from "next/navigation";

// Legacy CSV importer — superseded by /admin/upload (has history + debug).
// Old URL kept as a redirect so bookmarks/links don't break.
export default function RedirectPage() {
  redirect("/admin/upload");
}
