import { redirect } from "next/navigation";

// Legacy financials hub — superseded by /admin/finance.
// Old URL kept as a redirect so bookmarks/links don't break.
export default function RedirectPage() {
  redirect("/admin/finance");
}
