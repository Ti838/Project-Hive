// ─── Centralized ProjectHive Brand Configuration ──────────────────────────────
// ALL brand assets, identity tokens, names, and organizational links are defined here.
// Strictly NO component should hardcode logo paths, company names, or brand links.

export interface BrandConfig {
  name: string;
  nameHighlight: string;
  shortName: string;
  tagline: string;
  description: string;
  version: string;
  organization: {
    name: string;
    tagline: string;
    url: string;
    logo: string;
  };
  assets: {
    logo: string;
    logoDark: string;
    logoLight: string;
    logoIcon: string;
    favicon: string;
    appleTouchIcon: string;
  };
  urls: {
    home: string;
    terms: string;
    privacy: string;
    support: string;
    adminLogin: string;
    adminPortal: string;
  };
}

export const BRAND_CONFIG: BrandConfig = {
  name: 'ProjectHive',
  nameHighlight: 'Hive',
  shortName: 'Hive',
  tagline: 'The University Collaboration Mesh',
  description: 'The all-in-one university incubation platform connecting student developers, designers, and researchers with Discord-grade squads, LiveKit SFU calling, and cascading AI assistance.',
  version: '2.0.0',
  organization: {
    name: 'BITA',
    tagline: 'Building Ideas. Engineering the Future.',
    url: 'https://bita-studio.vercel.app/',
    logo: '/bita-logo.png',
  },
  assets: {
    logo: '/logo.png',
    logoDark: '/logo.png',
    logoLight: '/logo.png',
    logoIcon: '/logo.png',
    favicon: '/favicon.png',
    appleTouchIcon: '/logo.png',
  },
  urls: {
    home: '/',
    terms: '/terms',
    privacy: '/privacy',
    support: '/help',
    adminLogin: '/admin/login',
    adminPortal: '/admin',
  },
};
