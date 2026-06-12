import { redirect } from "next/navigation";

// Telecaller outreach board — superseded by the /sales cockpit.
// Old URL kept as a redirect so bookmarks/links don't break.
export default function RedirectPage() {
  redirect("/sales");
}
