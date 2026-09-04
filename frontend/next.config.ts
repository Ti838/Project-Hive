import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Dynamic profile and user alias redirects
      {
        source: '/user/:id',
        destination: '/profile/:id',
        permanent: true,
      },
      {
        source: '/profile/view/:id',
        destination: '/profile/:id',
        permanent: true,
      },
      {
        source: '/profile/edit',
        destination: '/profile?edit=true',
        permanent: false,
      },
      {
        source: '/profile/view',
        destination: '/profile',
        permanent: true,
      },

      // AI studio aliases
      {
        source: '/ai',
        destination: '/generator',
        permanent: true,
      },
      {
        source: '/ai-generator',
        destination: '/generator',
        permanent: true,
      },

      // Legacy static HTML redirects
      {
        source: '/pages/auth/login.html',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/pages/auth/register.html',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/pages/auth/forgot-password.html',
        destination: '/forgot-password',
        permanent: true,
      },
      {
        source: '/pages/auth/reset-password.html',
        destination: '/reset-password',
        permanent: true,
      },
      {
        source: '/pages/auth/verify-email.html',
        destination: '/verify-email',
        permanent: true,
      },
      {
        source: '/pages/auth/callback.html',
        destination: '/auth/callback',
        permanent: true,
      },
      {
        source: '/pages/user/dashboard.html',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/pages/user/feed.html',
        destination: '/feed',
        permanent: true,
      },
      {
        source: '/pages/user/messages.html',
        destination: '/messages',
        permanent: true,
      },
      {
        source: '/pages/user/teams.html',
        destination: '/teams',
        permanent: true,
      },
      {
        source: '/pages/user/teams-create.html',
        destination: '/teams/create',
        permanent: true,
      },
      {
        source: '/pages/user/projects/showcase.html',
        destination: '/showcase',
        permanent: true,
      },
      {
        source: '/pages/user/projects/generator.html',
        destination: '/generator',
        permanent: true,
      },
      {
        source: '/pages/user/people.html',
        destination: '/people',
        permanent: true,
      },
      {
        source: '/pages/user/saved.html',
        destination: '/saved',
        permanent: true,
      },
      {
        source: '/pages/user/settings.html',
        destination: '/settings',
        permanent: true,
      },
      {
        source: '/pages/user/notifications.html',
        destination: '/notifications',
        permanent: true,
      },
      {
        source: '/pages/user/profile/view.html',
        destination: '/profile',
        permanent: true,
      },
      {
        source: '/pages/user/profile/edit.html',
        destination: '/profile?edit=true',
        permanent: false,
      },
      {
        source: '/pages/admin/login.html',
        destination: '/admin/login',
        permanent: true,
      },
      {
        source: '/pages/admin/dashboard.html',
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        source: '/pages/admin/mobile-blocked.html',
        destination: '/admin/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
