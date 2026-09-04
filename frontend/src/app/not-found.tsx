'use client';
// ─── Custom 404 Page ───────────────────────────────────────────────────────────

import Link from 'next/link';
import { Hexagon, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function NotFound() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const returnHref = !isLoading && isAuthenticated ? '/dashboard' : '/';
  const returnLabel = !isLoading && isAuthenticated ? 'Return to Dashboard' : 'Return to Home';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-sm">
        <Hexagon className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">404 — Page Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        The hive couldn&apos;t find the page you&apos;re looking for. It might have moved or is still being built.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={returnHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {returnLabel}
        </Link>
        {!isLoading && !isAuthenticated && (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent transition-colors shadow-xs"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

