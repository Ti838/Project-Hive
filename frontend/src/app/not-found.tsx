'use client';
// ─── Custom 404 Page ───────────────────────────────────────────────────────────

import Link from 'next/link';
import { Hexagon, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
        <Hexagon className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">404 — Page Not Found</h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        The hive couldn't find the page you're looking for. It might have moved or is still being built.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
}

