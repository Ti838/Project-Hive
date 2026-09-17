'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import { displayName, getInitials, getAvatarColor } from '@/lib/utils';
import { Sun, Moon, Monitor, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Discover', href: '/people' },
  { label: 'Squads', href: '/teams' },
  { label: 'Projects', href: '/projects' },
];

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const userName = mounted && user ? displayName(user) : '';
  const avatarColor = mounted && user?.avatar_color ? user.avatar_color : getAvatarColor(user?.id || 'guest');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: '-100%' },
    visible: { 
      opacity: 1, 
      y: '0%',
      transition: { duration: 0.6 }
    },
    exit: {
      opacity: 0,
      y: '-20%',
      transition: { duration: 0.4 }
    }
  };

  const mobileLinkVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'py-3 bg-background/70 backdrop-blur-xl border-b border-foreground/5 shadow-subtle' 
            : 'py-5 bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 flex items-center justify-between">
          
          {/* LEFT: Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-[60]" onClick={() => setMobileMenuOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="w-9 h-9 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center p-2 backdrop-blur-md transition-transform duration-300 group-hover:scale-105"
            >
              <img src="/logo.png" alt="ProjectHive" className="w-full h-full object-contain drop-shadow-md" />
            </motion.div>
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-semibold text-lg tracking-wide hidden sm:block text-foreground/90"
            >
              ProjectHive
            </motion.span>
          </Link>

          {/* CENTER: Navigation Links (Desktop) */}
          <motion.nav 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2"
          >
            {NAV_LINKS.map((link) => (
              <motion.div key={link.label} variants={itemVariants}>
                <Link 
                  href={link.href}
                  className="text-sm font-medium text-foreground/60 hover:text-foreground transition-all duration-300 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-foreground/50 transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </motion.nav>

          {/* RIGHT: Actions (Desktop) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="hidden md:flex items-center gap-4 z-10"
          >
            {mounted && (
              <button
                onClick={cycleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground/5 border border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all cursor-pointer backdrop-blur-md"
                aria-label="Toggle theme"
              >
                {theme === 'system' ? <Monitor className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}

            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-full bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 hover:border-foreground/20 transition-all text-sm font-medium backdrop-blur-md hover:shadow-[0_0_15px_-3px_rgba(255,255,255,0.1)]"
                >
                  Dashboard
                </Link>
                <Link href="/profile" className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border border-foreground/20 transition-transform hover:scale-105">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={userName} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitials(userName || 'U')}
                    </div>
                  )}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors px-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="relative group overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-medium text-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] dark:hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-foreground/20 dark:bg-background/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </Link>
              </div>
            )}
          </motion.div>

          {/* MOBILE MENU TOGGLE */}
          <div className="md:hidden flex items-center gap-3 z-[60]">
            {mounted && (
              <button
                onClick={cycleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground/5 border border-foreground/10 text-foreground/60 hover:text-foreground transition-all cursor-pointer backdrop-blur-md"
              >
                {theme === 'system' ? <Monitor className="w-4 h-4" /> : theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}
            <button 
              className="w-9 h-9 flex items-center justify-center text-foreground/80 hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* MOBILE FULLSCREEN MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col pt-28 px-8 pb-8"
          >
            <motion.nav 
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
              }}
              className="flex flex-col gap-6"
            >
              {NAV_LINKS.map((link) => (
                <motion.div key={link.label} variants={mobileLinkVariants}>
                  <Link 
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-3xl font-medium tracking-tight text-foreground/80 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div variants={mobileLinkVariants} className="h-px w-full bg-foreground/10 my-4" />
              
              {mounted && isAuthenticated ? (
                <motion.div variants={mobileLinkVariants} className="flex flex-col gap-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl font-medium text-foreground"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-medium text-foreground/70"
                  >
                    Profile Settings
                  </Link>
                </motion.div>
              ) : (
                <motion.div variants={mobileLinkVariants} className="flex flex-col gap-4">
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-4 rounded-xl bg-foreground text-background font-medium text-center text-lg transition-transform active:scale-95"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-4 rounded-xl border border-foreground/10 bg-foreground/5 font-medium text-center text-lg transition-transform active:scale-95"
                  >
                    Sign In
                  </Link>
                </motion.div>
              )}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


