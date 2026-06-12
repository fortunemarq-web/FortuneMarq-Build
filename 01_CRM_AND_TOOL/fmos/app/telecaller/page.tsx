import { redirect } from "next/navigation";

// The telecaller cockpit was moved to /sales.
// Redirect any direct visits to /telecaller to the correct route.
export default function TelecallerPage() {
  redirect("/sales");
}
