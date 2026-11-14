'use client';

import Link from 'next/link';
import { ArrowUpRight, Shield, Sparkles, Globe, Terminal, MessageSquare } from 'lucide-react';
import { BrandLogo, BRAND_CONFIG } from '@/components/brand';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-background/95 text-foreground selection:bg-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand & Mission column */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo variant="full" size="md" linkTo="/" />
            
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {BRAND_CONFIG.description}
            </p>

            <div className="pt-2 flex items-center gap-3 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Platform links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/teams" className="hover:text-foreground transition-colors">Squad Discovery</Link></li>
                <li><Link href="/projects" className="hover:text-foreground transition-colors">Project Hub</Link></li>
                <li><Link href="/showcase" className="hover:text-foreground transition-colors">Project Showcase</Link></li>
                <li><Link href="/feed" className="hover:text-foreground transition-colors">Activity Feed</Link></li>
                <li><Link href="/generator" className="hover:text-foreground transition-colors">HiveMind AI</Link></li>
              </ul>
            </div>

            {/* Authentication links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-foreground transition-colors">Sign Up Free</Link></li>
                <li><Link href="/forgot-password" className="hover:text-foreground transition-colors">Reset Password</Link></li>
                <li><Link href="/verify-email" className="hover:text-foreground transition-colors">Verify Email</Link></li>
              </ul>
            </div>

            {/* Legal & Security */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Trust & Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help & Support</Link></li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <a
              href={BRAND_CONFIG.organization.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:opacity-85 transition-opacity"
              title={`${BRAND_CONFIG.organization.name} — ${BRAND_CONFIG.organization.tagline}`}
            >
              <BrandLogo variant="org" size="xs" />
            </a>
            <p>
              &copy; {new Date().getFullYear()} {BRAND_CONFIG.name}. A flagship product engineered by{' '}
              <a
                href={BRAND_CONFIG.organization.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-foreground hover:text-primary transition-colors"
              >
                {BRAND_CONFIG.organization.name}
              </a>.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href={BRAND_CONFIG.urls.terms} className="hover:text-foreground transition-colors">Terms</Link>
            <Link href={BRAND_CONFIG.urls.privacy} className="hover:text-foreground transition-colors">Privacy</Link>
            <a
              href={BRAND_CONFIG.organization.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors font-semibold text-primary"
            >
              {BRAND_CONFIG.organization.name} Official
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

