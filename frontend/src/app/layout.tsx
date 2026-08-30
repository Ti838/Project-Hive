import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0d14' },
  ],
};

export const metadata: Metadata = {
  title: 'ProjectHive 🐝 — Student Collaboration Platform',
  description: 'Discover teammates, collaborate on projects, and showcase your work in real-time.',
  manifest: '/manifest.json',
  applicationName: 'ProjectHive',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ProjectHive',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground selection:bg-primary/20 overscroll-none`}>
        {children}
      </body>
    </html>
  );
}
