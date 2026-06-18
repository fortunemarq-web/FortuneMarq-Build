import { notFound } from "next/navigation";

// Catch-all for unmatched marketing paths → renders the branded app/site/not-found.tsx.
// Next only auto-renders a nested not-found.tsx when notFound() is thrown inside the
// segment, so without this an unknown /site/* URL falls back to the global default 404.
// Explicit routes (/about, /services, /contact, …) take precedence over this catch-all.
// This is also what the host-split serves when the app surface is sealed (/admin → /site/admin).
export default function SiteCatchAll() {
  notFound();
}
