import Link from "next/link";

// App-wide 404 — replaces Next's default not-found screen for any unmatched
// in-app route with a branded page and a way back.
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <img src="/logo-icon-dark.png" alt="FortuneMarq" className="mb-6 h-14 w-auto object-contain" />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">404</p>
      <h1 className="mt-1 font-display text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-deep px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  );
}
