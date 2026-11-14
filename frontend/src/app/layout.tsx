import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';

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
  title: `${BRAND_CONFIG.name} — ${BRAND_CONFIG.tagline} by ${BRAND_CONFIG.organization.name}`,
  description: `${BRAND_CONFIG.description} A flagship product of ${BRAND_CONFIG.organization.name}.`,
  manifest: '/manifest.json',
  applicationName: BRAND_CONFIG.name,
  authors: [{ name: BRAND_CONFIG.organization.name, url: BRAND_CONFIG.organization.url }],
  creator: BRAND_CONFIG.organization.name,
  publisher: BRAND_CONFIG.organization.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: `${BRAND_CONFIG.name} by ${BRAND_CONFIG.organization.name}`,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: BRAND_CONFIG.assets.favicon,
    shortcut: BRAND_CONFIG.assets.favicon,
    apple: BRAND_CONFIG.assets.appleTouchIcon,
  },
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('ph-theme');
      var isDark = false;
      if (saved === 'dark') {
        isDark = true;
      } else if (saved === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground selection:bg-primary/20`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

