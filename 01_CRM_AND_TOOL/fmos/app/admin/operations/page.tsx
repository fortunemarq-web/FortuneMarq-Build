import { redirect } from "next/navigation";

// Legacy operations hub — superseded by /projects + /tasks.
// Old URL kept as a redirect so bookmarks/links don't break.
export default function RedirectPage() {
  redirect("/projects");
}
