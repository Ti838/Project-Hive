/**
 * ProjectHive — Centralized Sidebar Component
 * ph-sidebar.js
 *
 * Usage: <script src="...ph-sidebar.js"></script>
 *        <script>PHSidebar.init('dashboard', '../');</script>
 */

const PHSidebar = (() => {

  // Dev mode: running on Live Server (not port 5000) — skip auth guards, show mock UI
  const IS_DEV = window.location.port !== '5000' && window.location.port !== '443' && window.location.port !== '';
  window.PH_DEV_MODE = IS_DEV;

  const NAV = [
    { group: null,      href: '/dashboard',     key: 'dashboard',    icon: `<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>`, fill: 'currentColor', label: 'Dashboard' },
    { group: null,      href: '/feed',          key: 'feed',         icon: `<path d="M2 3h20v18H2V3zm2 2v14h16V5H4zm2 3h12v2H6V8zm0 4h12v2H6v-2zm0 4h8v2H6v-2z"/>`, fill: 'currentColor', label: 'Feed' },
    { group: null,      href: '/profile',       key: 'profile',      icon: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`, label: 'Profile' },
    { group: null,      href: '/messages',      key: 'messages',     icon: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`, label: 'Messages' },
    { group: null,      href: '/notifications', key: 'notifications',icon: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`, label: 'Notifications' },
    { group: 'Discover',href: '/teams',         key: 'teams',        icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`, label: 'Find Teams' },
    { group: null,      href: '/people',        key: 'people',       icon: `<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>`, fill: 'currentColor', label: 'Find People' },
    { group: null,      href: '/showcase',      key: 'showcase',     icon: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`, label: 'Showcase' },
    { group: null,      href: '/generator',     key: 'generator',    icon: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`, label: 'AI Generator' },
    { group: 'Account', href: '/settings',      key: 'settings',     icon: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`, label: 'Settings' },
  ];





  function ensureUserPolishStyles() {
    if (document.getElementById('ph-user-polish-css')) return;
    const link = document.createElement('link');
    link.id = 'ph-user-polish-css';
    link.rel = 'stylesheet';
    link.href = '/assets/css/user-polish.css?v=1';
    document.head.appendChild(link);
  }
  function svgIcon(d, fill = 'none') {
    const attrs = fill === 'currentColor'
      ? `fill="currentColor"`
      : `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    return `<svg width="16" height="16" viewBox="0 0 24 24" ${attrs}>${d}</svg>`;
  }

  function buildNav(items, active, base) {
    let html = '';
    let lastGroup = null;
    for (const item of items) {
      if (item.group && item.group !== lastGroup) {
        html += `<div class="ph-sb-section">${item.group}</div>`;
        lastGroup = item.group;
      }
      const isActive = item.key === active;
      // Absolute paths (start with /) are used as-is; relative paths get base prepended
      const href = item.href.startsWith('/') ? item.href : base + item.href;
      html += `
        <a href="${href}" class="ph-sb-link${isActive ? ' active' : ''}" data-key="${item.key}" title="${item.label}">
          ${svgIcon(item.icon, item.fill || 'none')}
          <span>${item.label}</span>
        </a>`;
    }
    return html;
  }

  function getInitials(fn, ln) {
    return ((fn?.[0] || '') + (ln?.[0] || '')).toUpperCase() || '?';
  }

  function getAvatarColor(name = '') {
    const colors = ['#6366f1','#7c3aed','#ec4899','#10b981','#f59e0b','#3b82f6'];
    let h = 0;
    for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  // ── Set user UI elements ───────────────────────────────────────────────────
  function setUserUI(u) {
    const fn   = u.firstName || u.first_name || u.user?.firstName || 'Student';
    const ln   = u.lastName  || u.last_name  || u.user?.lastName  || '';
    const name = fn + (ln ? ' ' + ln : '');
    const role = (u.role || 'student');
    const nameEl = document.getElementById('ph-sb-name');
    const avEl   = document.getElementById('ph-sb-av');
    const roleEl = document.getElementById('ph-sb-role');
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    if (avEl) {
      const avatar = u.avatar || u.user?.avatar;
      if (avatar && avatar.startsWith('data:')) {
        avEl.innerHTML = `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" alt="Avatar">`;
        avEl.style.background = 'transparent';
      } else {
        avEl.textContent = getInitials(fn, ln);
        avEl.style.background = getAvatarColor(name);
        avEl.style.color = '#fff';
      }
    }
    // Store name for call notifications
    localStorage.setItem('ph-sb-name', name);
  }

  async function loadUser(base) {
    // 1. Show cached data INSTANTLY (no flash of "Loading...")
    try {
      const cached = localStorage.getItem('ph-user-cache');
      if (cached) setUserUI(JSON.parse(cached));
    } catch(_) {}

    // 2. Fetch fresh data from API
    try {
      const tk = localStorage.getItem('access_token');
      if (!tk) return;
      const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? (location.port === '3000' ? 'http://localhost:5000' : '') : 'https://projecthive-backend.onrender.com';
      const r = await fetch(apiBase + '/api/users/me', {
        headers: { Authorization: 'Bearer ' + tk }
      });
      if (!r.ok) return;
      const u = await r.json();
      localStorage.setItem('ph-user-cache', JSON.stringify(u)); // cache it
      setUserUI(u);
    } catch(_) {}
  }


  async function loadUnreadCount(base) {
    try {
      const tk = localStorage.getItem('access_token');
      if (!tk) return;
      const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? (location.port === '3000' ? 'http://localhost:5000' : '') : 'https://projecthive-backend.onrender.com';
      const r = await fetch(apiBase + '/api/messages/conversations', {
        headers: { Authorization: 'Bearer ' + tk }
      });
      if (!r.ok) return;
      const d = await r.json();
      const list = d.conversations || d || [];
      const sum = list.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      const msgLink = document.querySelector('.ph-sb-link[data-key="messages"]');
      if (msgLink) {
        let badge = msgLink.querySelector('.ph-sb-msg-badge');
        if (sum > 0) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'ph-sb-msg-badge bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0';
            msgLink.appendChild(badge);
          }
          badge.textContent = sum;
        } else {
          if (badge) badge.remove();
        }
      }
    } catch(e) {}
  }

  function render(active, base = '../../') {
    const navItems = NAV;
    const sidebar = document.getElementById('ph-sidebar');
    if (!sidebar) return;

    // Logo always goes to clean /dashboard URL
    const logoHref = '/dashboard';

    // Show cached user instantly — no flash of '?' or 'Loading...'
    let cachedName = 'Loading\u2026', cachedInitials = '?', cachedBg = '#6366f1', cachedRole = 'Student', cachedAvatar = null;
    try {
      const c = JSON.parse(localStorage.getItem('ph-user-cache') || 'null');
      if (c) {
        const fn = c.firstName || c.first_name || 'Student';
        const ln = c.lastName  || c.last_name  || '';
        cachedName = fn + (ln ? ' ' + ln : '');
        cachedInitials = ((fn[0]||'') + (ln[0]||'')).toUpperCase() || '?';
        cachedRole = (c.role || 'student');
        cachedRole = cachedRole.charAt(0).toUpperCase() + cachedRole.slice(1);
        const cols = ['#6366f1','#7c3aed','#ec4899','#10b981','#f59e0b','#3b82f6'];
        let h = 0; for (const ch of cachedName) h = ch.charCodeAt(0) + ((h << 5) - h);
        cachedBg = cols[Math.abs(h) % cols.length];
        cachedAvatar = c.avatar || null;
      }
    } catch(_) {}

    sidebar.innerHTML = `
      <button class="ph-sb-close-btn" id="ph-sb-close" aria-label="Close menu" onclick="PHSidebar.closeDrawer()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <button class="ph-sb-collapse-btn" id="ph-sb-collapse-btn" onclick="PHSidebar.toggleCollapse()" aria-label="Toggle sidebar collapse" title="Toggle Sidebar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <a href="${logoHref}" class="ph-sb-brand">
        <div class="ph-sb-logo">
          <img src="/favicon.png?v=2" alt="ProjectHive" onerror="this.parentElement.innerHTML='🐝'">
        </div>
        <div class="ph-sb-brand-txt">
          <div class="ph-sb-brand-name">ProjectHive</div>
          <div class="ph-sb-brand-sub">Premium Workspace</div>
        </div>
      </a>
      <div class="ph-sb-user">
        <div class="ph-sb-av" id="ph-sb-av" style="background:${cachedAvatar ? 'transparent' : cachedBg}">${IS_DEV ? '🔧' : (cachedAvatar ? `<img src="${cachedAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">` : cachedInitials)}</div>
        <div style="min-width:0;">
          <div class="ph-sb-user-name" id="ph-sb-name">${IS_DEV ? 'Dev Preview' : cachedName}</div>
          <div class="ph-sb-user-role" id="ph-sb-role">${IS_DEV ? '<span style="color:#f59e0b;font-size:10px;font-weight:700;letter-spacing:.05em">⚡ LIVE SERVER MODE</span>' : cachedRole}</div>
        </div>
      </div>
      <nav class="ph-sb-nav">${buildNav(navItems, active, base)}</nav>
      <div class="ph-sb-footer">
        <!-- Theme Toggle -->
        <button class="ph-sb-theme-btn" id="ph-sb-theme-btn" onclick="PHSidebar.toggleTheme()" title="Toggle dark/light mode">
          <svg class="ph-theme-svg-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg class="ph-theme-svg-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <span class="ph-sb-theme-label" id="ph-sb-theme-label">Light Mode</span>
        </button>
        <button class="ph-sb-signout" onclick="PHSidebar.showLogoutModal()" title="Sign Out">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>`;

    loadUser(base);
    loadUnreadCount(base);

    // ── Restore sidebar scroll position (persisted across page navigations) ──
    const navWrap = document.querySelector('#ph-sidebar .ph-sb-nav');
    if (navWrap) {
      const savedScroll = sessionStorage.getItem('ph-sb-scroll');
      if (savedScroll) {
        navWrap.scrollTop = parseInt(savedScroll) || 0;
      } else {
        // First visit — scroll active link into view without animation
        const activeLink = navWrap.querySelector('.ph-sb-link.active');
        if (activeLink) activeLink.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }

    // Save sidebar scroll position before navigating away
    document.querySelectorAll('#ph-sidebar .ph-sb-link').forEach(link => {
      link.addEventListener('click', () => {
        const nw = document.querySelector('#ph-sidebar .ph-sb-nav');
        if (nw) sessionStorage.setItem('ph-sb-scroll', nw.scrollTop);
      });
    });

    // ── Prefetch all sidebar pages for instant navigation ──────────────────
    // After 3 seconds (don't compete with initial page load), inject <link rel="prefetch"> for all nav pages
    setTimeout(() => {
      NAV.forEach(item => {
        const href = item.href.startsWith('/') ? item.href : base + item.href;
        if (item.key === active) return; // skip current page
        if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return; // already exists
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        link.as = 'document';
        document.head.appendChild(link);
      });
    }, 3000);

    // ── Restore user preferences (accent color + font size) globally ─────
    try {
      const ac = localStorage.getItem('ph-accent');
      if (ac) {
        document.documentElement.style.setProperty('--ac', ac);
        document.documentElement.style.setProperty('--ac2', ac);
        const rgb = [parseInt(ac.slice(1,3),16), parseInt(ac.slice(3,5),16), parseInt(ac.slice(5,7),16)];
        document.documentElement.style.setProperty('--ac-light', `rgba(${rgb.join(',')},0.12)`);
      }
      const fs = localStorage.getItem('ph-font-size');
      if (fs) {
        const map = {small:'13px', normal:'15px', large:'17px'};
        document.documentElement.style.setProperty('--font-base', map[fs] || '15px');
      }
    } catch(_) {}
  }

  // Mobile overlay
  function buildOverlay() {
    if (document.getElementById('ph-mob-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'ph-mob-overlay';
    ov.className = 'ph-mob-overlay';
    ov.addEventListener('click', closeDrawer);
    document.body.appendChild(ov);
  }

  function openDrawer() {
    document.getElementById('ph-sidebar')?.classList.add('open');
    document.getElementById('ph-mob-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('ph-sidebar')?.classList.remove('open');
    document.getElementById('ph-mob-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function ensureMobileFixesStyles() {
    if (document.getElementById('ph-mobile-fixes-css')) return;
    const link = document.createElement('link');
    link.id = 'ph-mobile-fixes-css';
    link.rel = 'stylesheet';
    link.href = '/assets/css/mobile-fixes.css?v=2';
    document.head.appendChild(link);
  }

  function init(active, base = '../../') {
    ensureUserPolishStyles();
    ensureMobileFixesStyles();
    // Theme init first (idempotent) — supports 'system', 'dark', 'light'
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // 'system' or null — follow OS preference
      if (matchMedia('(prefers-color-scheme:dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Listen for real-time OS theme changes (when in 'system' mode)
    try {
      const mq = matchMedia('(prefers-color-scheme:dark)');
      mq.addEventListener('change', (e) => {
        const current = localStorage.getItem('theme');
        if (!current || current === 'system') {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          syncThemeBtn();
        }
      });
    } catch(_) {}

    // Collapse init
    const isCollapsed = localStorage.getItem('ph-sidebar-collapsed') === 'true';
    if (isCollapsed && window.innerWidth > 768) {
      document.documentElement.classList.add('sidebar-collapsed');
    }

    // ── Keep-alive: ping Render backend so it never sleeps ──
    if (!IS_DEV) {
      const BACKEND = 'https://projecthive-backend.onrender.com';
      const ping = () => fetch(BACKEND + '/health', { signal: AbortSignal.timeout(8000) }).catch(() => {});
      ping(); // immediate ping on page load
      // Re-ping every 8 minutes (Render sleeps after 15min of inactivity)
      setInterval(ping, 8 * 60 * 1000);
    }

    const doRender = () => {
      render(active, base);
      buildOverlay();
      try { if (typeof buildBottomNav === 'function') buildBottomNav(active, base); } catch(_) {}
      try { if (typeof buildMobileFAB === 'function') buildMobileFAB(base); } catch(_) {}
      try { injectHamburger(base); } catch(_) {}
      try { if (typeof setupMobileHeader === 'function') setupMobileHeader(); } catch(_) {}
      try { wireThemeButtons(); } catch(_) {}
      try { if (typeof initTransitions === 'function') initTransitions(); } catch(_) {}
      try { initGlobalSearch(base); } catch(_) {}
      try { if (typeof initGlobalProfile === 'function') initGlobalProfile(base); } catch(_) {}
      try { initGlobalRealtime(base); } catch(_) {}
    };

    if (document.getElementById('ph-sidebar')) {
      doRender();
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', doRender);
    } else {
      doRender();
    }
  }

  // ── Global Search (Ctrl+K Modal) ──
  function initGlobalSearch(base) {
    if (document.getElementById('ph-search-backdrop')) return;

    // 1. Inject Stylesheet
    const style = document.createElement('style');
    style.textContent = `
      .ph-search-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 17, 23, 0.7);
        backdrop-filter: blur(12px);
        z-index: 1000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
        transition: opacity 0.2s ease-out;
      }
      .ph-search-container {
        width: 90%;
        max-width: 600px;
        background: rgba(26, 27, 39, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        overflow: hidden;
        color: #E4E1EB;
        font-family: 'Inter', sans-serif;
        transform: translateY(-20px);
        transition: transform 0.2s ease-out;
      }
      html:not(.dark) .ph-search-container {
        background: rgba(255, 255, 255, 0.9);
        border-color: rgba(99, 102, 241, 0.1);
        box-shadow: 0 20px 50px rgba(99, 102, 241, 0.1), inset 0 1px 0 #fff;
        color: #0F172A;
      }
      .ph-search-header {
        display: flex;
        align-items: center;
        padding: 16px;
        border-bottom: 1.5px solid rgba(255, 255, 255, 0.08);
      }
      html:not(.dark) .ph-search-header {
        border-bottom-color: rgba(0, 0, 0, 0.06);
      }
      .ph-search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 16px;
        color: inherit;
        margin-left: 12px;
      }
      .ph-search-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
      html:not(.dark) .ph-search-input::placeholder {
        color: rgba(0, 0, 0, 0.4);
      }
      .ph-search-body {
        max-height: 400px;
        overflow-y: auto;
        padding: 8px;
      }
      .ph-search-group-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(255, 255, 255, 0.4);
        padding: 8px 12px;
      }
      html:not(.dark) .ph-search-group-title {
        color: rgba(0, 0, 0, 0.4);
      }
      .ph-search-row {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s, transform 0.15s;
        gap: 12px;
      }
      .ph-search-row:hover, .ph-search-row.selected {
        background: rgba(99, 102, 241, 0.15);
      }
      .ph-search-row-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #fff;
        font-size: 12px;
      }
      .ph-search-row-details {
        flex: 1;
        min-width: 0;
      }
      .ph-search-row-title {
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ph-search-row-subtitle {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      html:not(.dark) .ph-search-row-subtitle {
        color: rgba(0, 0, 0, 0.5);
      }
      .ph-search-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(99, 102, 241, 0.1);
        color: #818CF8;
      }
      html:not(.dark) .ph-search-badge {
        color: #6366F1;
      }
      .ph-search-k-hint {
        font-size: 10px;
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      html:not(.dark) .ph-search-k-hint {
        background: rgba(0, 0, 0, 0.03);
        border-color: rgba(0, 0, 0, 0.06);
      }
    `;
    document.head.appendChild(style);

    // 2. Inject DOM Elements
    const backdrop = document.createElement('div');
    backdrop.id = 'ph-search-backdrop';
    backdrop.className = 'ph-search-backdrop';
    backdrop.style.display = 'none';
    backdrop.innerHTML = `
      <div class="ph-search-container" id="ph-search-container">
        <div class="ph-search-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" class="ph-search-input" id="ph-search-input" placeholder="Search users, teams, projects, posts..." autocomplete="off">
          <span class="ph-search-k-hint">ESC</span>
        </div>
        <div class="ph-search-body" id="ph-search-body">
          <div class="text-center p-8 text-sm opacity-50">Type something to begin searching...</div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const input = document.getElementById('ph-search-input');
    const body = document.getElementById('ph-search-body');

    // 3. Event Listeners
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSearch();
    });

    input.addEventListener('input', () => {
      debounceSearch(input.value.trim());
    });

    input.addEventListener('keydown', (e) => {
      const rows = Array.from(body.querySelectorAll('.ph-search-row'));
      const selectedIndex = rows.findIndex(r => r.classList.contains('selected'));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rows.length === 0) return;
        const next = (selectedIndex + 1) % rows.length;
        if (selectedIndex >= 0) rows[selectedIndex].classList.remove('selected');
        rows[next].classList.add('selected');
        rows[next].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rows.length === 0) return;
        const prev = (selectedIndex - 1 + rows.length) % rows.length;
        if (selectedIndex >= 0) rows[selectedIndex].classList.remove('selected');
        rows[prev].classList.add('selected');
        rows[prev].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0) {
          rows[selectedIndex].click();
        }
      }
    });

    let searchTimer = null;
    function debounceSearch(q) {
      clearTimeout(searchTimer);
      if (!q) {
        body.innerHTML = '<div class="text-center p-8 text-sm opacity-50">Type something to begin searching...</div>';
        return;
      }
      body.innerHTML = '<div class="text-center p-8 text-sm opacity-50 flex items-center justify-center gap-2"><svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="8"/></svg> Searching...</div>';
      searchTimer = setTimeout(() => executeSearch(q), 300);
    }

    async function executeSearch(q) {
      try {
        const tk = localStorage.getItem('access_token');
        const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
          ? (location.port === '3000' ? 'http://localhost:5000' : '')
          : 'https://projecthive-backend.onrender.com';

        const r = await fetch(apiBase + `/api/users/global-search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: 'Bearer ' + tk }
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        renderResults(data);
      } catch (e) {
        body.innerHTML = '<div class="text-center p-8 text-sm text-red-500">Search failed. Try again.</div>';
      }
    }

    function renderResults(data) {
      const { users, teams, projects, posts } = data;
      let html = '';

      if (!users.length && !teams.length && !projects.length && !posts.length) {
        body.innerHTML = '<div class="text-center p-8 text-sm opacity-50">No results found</div>';
        return;
      }

      const appendGroup = (title, items, redirectFn) => {
        if (!items || !items.length) return;
        html += `<div class="ph-search-group-title">${title}</div>`;
        items.forEach((item) => {
          const initials = ((item.title || '')[0] || '?').toUpperCase();
          const avBg = item.avatarColor || '#6366f1';
          const avatarHtml = item.avatar
            ? `<img src="${item.avatar}" class="w-8 h-8 rounded-full object-cover">`
            : `<div class="ph-search-row-avatar" style="background:${avBg}">${initials}</div>`;

          html += `
            <div class="ph-search-row" onclick="(${redirectFn.toString()})('${item.id}', '${base}')">
              ${item.type === 'user' ? avatarHtml : `<span class="material-symbols-outlined text-indigo-500">${item.type === 'team' ? 'groups' : item.type === 'project' ? 'rocket_launch' : 'newspaper'}</span>`}
              <div class="ph-search-row-details">
                <div class="ph-search-row-title">${esc(item.title)}</div>
                <div class="ph-search-row-subtitle">${esc(item.subtitle)}</div>
              </div>
              <span class="ph-search-badge">${item.type}</span>
            </div>
          `;
        });
      };

      appendGroup('Teammates & Students', users, (id, base) => {
        window.location.href = `/profile/view?id=${id}`;
      });
      appendGroup('Teams', teams, (id, base) => {
        window.location.href = `/teams?tid=${id}`;
      });
      appendGroup('Showcase Projects', projects, (id, base) => {
        window.location.href = `/showcase?pid=${id}`;
      });
      appendGroup('Recent Posts', posts, (id, base) => {
        window.location.href = `/feed?post=${id}`;
      });

      body.innerHTML = html;

      // Auto-select first item
      const firstRow = body.querySelector('.ph-search-row');
      if (firstRow) firstRow.classList.add('selected');
    }

    function esc(s) {
      const d = document.createElement('div');
      d.textContent = s || '';
      return d.innerHTML;
    }

    function toggleSearch() {
      const isHidden = backdrop.style.display === 'none';
      if (isHidden) {
        backdrop.style.display = 'flex';
        input.value = '';
        input.focus();
        body.innerHTML = '<div class="text-center p-8 text-sm opacity-50">Type something to begin searching...</div>';
      } else {
        closeSearch();
      }
    }

    function closeSearch() {
      backdrop.style.display = 'none';
    }

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape') {
        closeSearch();
      }
    });

    // #27 — Mobile search trigger button (visible 🔍 in topbar)
    if (window.innerWidth <= 768) {
      const topbar = document.querySelector('.ph-topbar');
      if (topbar && !topbar.querySelector('.ph-mobile-search-btn')) {
        const searchBtn = document.createElement('button');
        searchBtn.className = 'ph-mobile-search-btn';
        searchBtn.setAttribute('aria-label', 'Search');
        searchBtn.setAttribute('title', 'Search');
        searchBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:none;background:var(--sf2,#f1f5f9);cursor:pointer;border-radius:10px;transition:all .15s;flex-shrink:0;color:var(--sub,#64748b);';
        searchBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
        searchBtn.addEventListener('click', toggleSearch);
        // Insert before the last child or append
        const lastChild = topbar.lastElementChild;
        if (lastChild) {
          topbar.insertBefore(searchBtn, lastChild);
        } else {
          topbar.appendChild(searchBtn);
        }
      }
    }
  }

  // ── Global Realtime Socket & Sounds ──
  function initGlobalRealtime(base) {
    if (window.phGlobalSocketInited) return;
    window.phGlobalSocketInited = true;

    const tk = localStorage.getItem('access_token');
    if (!tk) return;

    if (typeof io === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
      script.onload = () => setupSockets(tk);
      document.head.appendChild(script);
    } else {
      setupSockets(tk);
    }

    function playNotificationSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } catch(e) {}
    }

    function playCallSound() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const playRing = (startTime) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.connect(gain); osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.type = 'sine'; osc2.type = 'sine';
          osc1.frequency.value = 440; osc2.frequency.value = 480;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
          gain.gain.linearRampToValueAtTime(0, startTime + 1.5);
          osc1.start(startTime); osc2.start(startTime);
          osc1.stop(startTime + 1.5); osc2.stop(startTime + 1.5);
        };
        for(let i=0; i<3; i++) playRing(ctx.currentTime + i * 2);
      } catch(e) {}
    }

    function setupSockets(token) {
      const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? (location.port === '3000' ? 'http://localhost:5000' : '') : 'https://projecthive-backend.onrender.com';

      const socket = io(apiBase, { auth: { token }, transports: ['websocket', 'polling'] });

      socket.on('notification:new', (notif) => {
        playNotificationSound();
        if (typeof PHToast !== 'undefined' && PHToast.info) {
          PHToast.info(`<strong>${notif.title||'Notification'}</strong><br/><span style="font-size:12px">${notif.message||''}</span>`);
        }
        // Update topbar bell red dot
        const topbarBadge = document.getElementById('topbar-unread');
        if (topbarBadge) topbarBadge.classList.remove('hidden');

        // Update sidebar badge
        const notifBadge = document.getElementById('notif-badge');
        if (notifBadge) {
          const cur = parseInt(notifBadge.textContent) || 0;
          notifBadge.textContent = cur + 1;
          notifBadge.classList.remove('hidden');
        }
      });

      socket.on('call:incoming', (data) => {
        const callData = {
          roomId: data.roomId,
          callerId: data.callerId || data.teamId || '',
          callerName: data.callerName || 'Someone',
          isWebRTC: !!data.isWebRTC,
          isVoiceOnly: !!data.isVoiceOnly,
          isGroup: !!data.isGroup,
          teamId: data.teamId || null,
          receivedAt: Date.now()
        };
        // Messages page owns the full incoming modal/ringtone flow.
        if (location.pathname.includes('/messages')) return;
        try { sessionStorage.setItem('pending-call', JSON.stringify(callData)); } catch(_) {}
        playCallSound();

        const answerHref = `/messages?chat=${encodeURIComponent(callData.callerId || callData.teamId || '')}&incoming=1`;
        if (typeof PHToast !== 'undefined' && PHToast.info) {
          PHToast.info(
            `<div style="display:flex;align-items:center;gap:12px;">
              <span class="material-symbols-outlined" style="font-size:28px;color:#10b981;">call</span>
              <div>
                <strong>Incoming ${callData.isVoiceOnly ? 'Voice' : 'Video'} Call</strong><br/>
                <span style="font-size:12px">${callData.callerName} is calling you.</span><br/>
                <a href="${answerHref}" style="display:inline-flex;align-items:center;gap:6px;margin-top:6px;background:#10b981;color:#fff;padding:7px 12px;border-radius:8px;text-decoration:none;font-weight:800;font-size:12px">Answer Call</a>
              </div>
            </div>`, 30000
          );
        }
      });

      // ── Phase B: Real-time message badge ────────────────────────────────────
      // Bump sidebar + bottom nav message badge when a message arrives on any page.
      socket.on('message:received', (data) => {
        if (location.pathname.includes('/messages')) return;
        const msgLink = document.querySelector('.ph-sb-link[data-key="messages"]');
        if (msgLink) {
          let badge = msgLink.querySelector('.ph-sb-msg-badge');
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'ph-sb-msg-badge';
            badge.style.cssText = 'margin-left:auto;min-width:18px;height:18px;border-radius:999px;background:#6366f1;color:#fff;font-size:10px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;padding:0 4px;';
            msgLink.appendChild(badge);
          }
          badge.textContent = (parseInt(badge.textContent) || 0) + 1;
        }
        const bnMsg = document.querySelector('#ph-bottom-nav a[data-key="messages"]');
        if (bnMsg) {
          let bnBadge = bnMsg.querySelector('.ph-bn-msg-badge');
          if (!bnBadge) {
            bnBadge = document.createElement('span');
            bnBadge.className = 'ph-bn-msg-badge';
            bnBadge.style.cssText = 'position:absolute;top:4px;right:8px;min-width:16px;height:16px;border-radius:999px;background:#6366f1;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 3px;';
            bnMsg.style.position = 'relative';
            bnMsg.appendChild(bnBadge);
          }
          bnBadge.textContent = (parseInt(bnBadge.textContent) || 0) + 1;
        }
        if (typeof PHToast !== 'undefined' && PHToast.info && data.sender) {
          const sn = data.sender.first_name ? (data.sender.first_name + ' ' + (data.sender.last_name || '')).trim() : 'Someone';
          PHToast.info('<strong>' + sn + '</strong><br/><span style="font-size:12px;opacity:.85">' + (data.content || '').slice(0, 60) + '</span>', 4000);
        }
      });
      window.phGlobalSocket = socket;
    }
  }

  // ── Phase B: Cross-tab theme sync ─────────────────────────────────────────
  // When theme is changed in another tab/window, sync instantly without refresh.
  window.addEventListener('storage', (e) => {
    if (e.key !== 'theme') return;
    const val = e.newValue;
    if (val === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (val === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (matchMedia('(prefers-color-scheme:dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    try { syncThemeBtn(); } catch(_) {}
  });


  // ══ Premium Mobile Bottom Navigation Bar ══════════════════════════════════
  function buildBottomNav(active, base) {
    if (document.getElementById('ph-bottom-nav')) return; // already injected

    const items = [
      { key: 'dashboard', href: '/dashboard', label: 'Home',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>` },
      { key: 'showcase', href: '/showcase', label: 'Projects',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
      { key: 'messages', href: '/messages', label: 'Chat',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
      { key: 'notifications', href: '/notifications', label: 'Alerts',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
      { key: 'profile', href: '#', label: 'Me', isSheet: true,
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    ];

    const nav = document.createElement('nav');
    nav.id = 'ph-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');
    nav.innerHTML = items.map(item => {
      const isActive = item.key === active;
      if (item.isSheet) {
        return `<button class="ph-bn-item${active === 'profile' ? ' active' : ''}" id="ph-bn-profile-btn" data-key="profile" title="${item.label}">
          ${item.icon}
          <span>${item.label}</span>
        </button>`;
      }
      return `<a href="${item.href}" class="ph-bn-item${isActive ? ' active' : ''}" data-key="${item.key}" title="${item.label}">
        ${item.icon}
        <span>${item.label}</span>
      </a>`;
    }).join('');

    document.body.appendChild(nav);

    // Wire Profile bottom sheet
    const profileBtn = document.getElementById('ph-bn-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openProfileSheet();
      });
    }

    // Build profile bottom sheet HTML
    buildProfileSheet();
  }

  function showComingSoon(feature) {
    if (typeof PHToast !== 'undefined' && PHToast.info) {
      PHToast.info(`${feature} feature coming soon!`);
    } else {
      alert(`${feature} feature coming soon!`);
    }
  }

  function buildProfileSheet() {
    if (document.getElementById('ph-profile-sheet-backdrop')) return;

    // Get cached user info
    let userName = 'Student', userInitials = '?', userBg = '#6366f1', userAvatar = null;
    try {
      const c = JSON.parse(localStorage.getItem('ph-user-cache') || 'null');
      if (c) {
        const fn = c.firstName || c.first_name || 'Student';
        const ln = c.lastName || c.last_name || '';
        userName = fn + (ln ? ' ' + ln : '');
        userInitials = ((fn[0]||'') + (ln[0]||'')).toUpperCase() || '?';
        userBg = getAvatarColor(userName);
        userAvatar = c.avatar || null;
      }
    } catch(_) {}

    const isDark = document.documentElement.classList.contains('dark');
    const themeLabel = isDark ? 'Light Mode' : 'Dark Mode';
    const themeIcon = isDark ? 'light_mode' : 'dark_mode';

    const backdrop = document.createElement('div');
    backdrop.id = 'ph-profile-sheet-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .25s ease;';
    backdrop.addEventListener('click', closeProfileSheet);

    const sheet = document.createElement('div');
    sheet.id = 'ph-profile-sheet';
    sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:var(--sf,#fff);border-radius:20px 20px 0 0;transform:translateY(100%);transition:transform .3s cubic-bezier(.32,1.28,.58,1);padding:0;box-shadow:0 -8px 40px rgba(0,0,0,.18);max-height:85vh;overflow-y:auto;';

    sheet.innerHTML = `
      <div style="display:flex;justify-content:center;padding:10px 0 4px">
        <div style="width:36px;height:4px;border-radius:4px;background:var(--bd,#e2e8f0)"></div>
      </div>
      <div style="padding:16px 20px 12px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--bd,#e2e8f0)">
        <div style="width:44px;height:44px;border-radius:50%;background:${userAvatar ? 'transparent' : userBg};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:15px;flex-shrink:0;overflow:hidden">
          ${userAvatar ? `<img src="${userAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : userInitials}
        </div>
        <div style="min-width:0;flex:1">
          <div style="font-size:15px;font-weight:700;color:var(--tx,#111)">${userName}</div>
          <div style="font-size:12px;color:var(--sub,#64748b)">ProjectHive Hub</div>
        </div>
      </div>
      <div style="padding:8px 12px 20px;display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;">
        <a href="/profile" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--ac,#6366f1)">person</span>Profile
        </a>
        <a href="/teams" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--ac,#6366f1)">groups</span>Teams
        </a>
        <a href="/messages" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:20px;color:#10b981">video_call</span>Meetings
        </a>
        <a href="/generator" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:20px;color:#f59e0b">auto_awesome</span>AI Assistant
        </a>
        <button onclick="PHSidebar.showComingSoon('Calendar')" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;border:none;background:none;text-align:left;color:var(--tx,#111);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--sub,#64748b)">calendar_month</span>Calendar
        </button>
        <button onclick="PHSidebar.showComingSoon('Files')" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;border:none;background:none;text-align:left;color:var(--tx,#111);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--sub,#64748b)">folder</span>Files
        </button>
        <button onclick="PHSidebar.showComingSoon('Tasks')" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;border:none;background:none;text-align:left;color:var(--tx,#111);font-family:inherit;font-size:13px;font-weight:600;cursor:pointer">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--sub,#64748b)">task_alt</span>Tasks
        </button>
        <a href="/saved" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--sub,#64748b)">bookmark</span>Saved
        </a>
        <a href="/settings" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--sub,#64748b)">settings</span>Settings
        </a>
        <a href="/pages/info/help.html" class="ph-ps-item" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;text-decoration:none;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:20px;color:var(--sub,#64748b)">help</span>Help
        </a>
        <button id="ph-ps-theme" data-theme-wired="1" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;width:100%;border:none;background:none;cursor:pointer;color:var(--tx,#111);transition:background .15s;min-height:48px;font-size:13px;font-weight:600;font-family:inherit;text-align:left;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none">
          <span class="material-symbols-outlined" id="ph-ps-theme-icon" style="font-size:20px;color:var(--sub,#64748b)">${themeIcon}</span>
          <span id="ph-ps-theme-label">${themeLabel}</span>
        </button>
        <button id="ph-ps-logout" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;width:100%;border:none;background:none;cursor:pointer;color:#ef4444;transition:background .15s;min-height:48px;font-size:13px;font-weight:700;font-family:inherit;text-align:left">
          <span class="material-symbols-outlined" style="font-size:20px">logout</span>Sign Out
        </button>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(sheet);

    // Hover effect for items
    sheet.querySelectorAll('.ph-ps-item, #ph-ps-theme, #ph-ps-logout').forEach(el => {
      el.addEventListener('mouseenter', () => el.style.background = 'var(--sf2, #f1f5f9)');
      el.addEventListener('mouseleave', () => el.style.background = 'none');
    });

    // Wire theme toggle
    const psThemeBtn = document.getElementById('ph-ps-theme');
    if (psThemeBtn) {
      psThemeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
        // Update icon and label to reflect new state
        const isDarkNow = document.documentElement.classList.contains('dark');
        const mode = localStorage.getItem('theme') || 'system';
        const icon = document.getElementById('ph-ps-theme-icon');
        const label = document.getElementById('ph-ps-theme-label');
        if (icon) icon.textContent = mode === 'system' ? 'routine' : (isDarkNow ? 'light_mode' : 'dark_mode');
        if (label) {
          if (mode === 'system') label.textContent = isDarkNow ? 'System (Dark)' : 'System (Light)';
          else label.textContent = isDarkNow ? 'Light Mode' : 'Dark Mode';
        }
      });
    }

    // Wire logout — use premium modal instead of browser confirm()
    document.getElementById('ph-ps-logout')?.addEventListener('click', () => {
      closeProfileSheet();
      showLogoutModal();
    });
  }

  function openProfileSheet() {
    const backdrop = document.getElementById('ph-profile-sheet-backdrop');
    const sheet = document.getElementById('ph-profile-sheet');
    if (backdrop) { backdrop.style.opacity = '1'; backdrop.style.pointerEvents = 'all'; }
    if (sheet) sheet.style.transform = 'translateY(0)';
    document.body.style.overflow = 'hidden';
  }

  function closeProfileSheet() {
    const backdrop = document.getElementById('ph-profile-sheet-backdrop');
    const sheet = document.getElementById('ph-profile-sheet');
    if (backdrop) { backdrop.style.opacity = '0'; backdrop.style.pointerEvents = 'none'; }
    if (sheet) sheet.style.transform = 'translateY(100%)';
    document.body.style.overflow = '';
  }

  // ══ Mobile FAB removed — AI is now in center of bottom nav ═══════════════
  function buildMobileFAB(base) {
    // No longer needed — AI button lives in bottom nav center
    return;
  }

  /** Inject a hamburger button into the page topbar/header for mobile */
  function injectHamburger(base) {
    // Only show on mobile
    if (window.innerWidth > 768) return;

    // Look for an existing hamburger slot first
    const slot = document.getElementById('ph-hamburger-slot');
    if (slot) {
      slot.innerHTML = `<button class="ph-hamburger" aria-label="Open menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>`;
      slot.querySelector('.ph-hamburger')?.addEventListener('click', () => PHSidebar.openDrawer());
      return;
    }

    // Auto-inject into .ph-topbar OR <header> (whichever exists)
    const target = document.querySelector('.ph-topbar') || document.querySelector('header');
    if (!target) return;
    // Don't inject twice
    if (target.querySelector('.ph-hamburger') || document.getElementById('ph-hamburger-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'ph-hamburger';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('id', 'ph-hamburger-btn');
    btn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:none;background:none;cursor:pointer;border-radius:10px;transition:background .15s;flex-shrink:0;';
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>`;
    btn.addEventListener('click', () => PHSidebar.openDrawer());
    target.insertBefore(btn, target.firstChild);
  }

  /** Set up LinkedIn-style mobile header: Move Avatar to left and bind to drawer */
  function setupMobileHeader() {
    if (window.innerWidth <= 768) {
      const avatar = document.getElementById('feed-avatar');
      const hamburgerSlot = document.getElementById('ph-hamburger-slot');

      if (avatar && hamburgerSlot) {
        // Move avatar to the left slot
        hamburgerSlot.innerHTML = '';
        hamburgerSlot.appendChild(avatar);

        // Bind drawer opening to Avatar
        avatar.style.cursor = 'pointer';
        avatar.onclick = PHSidebar.openDrawer;

        // Remove standard hamburger button if it exists
        const oldHamburger = document.getElementById('ph-hamburger-btn') || document.querySelector('.ph-hamburger');
        if (oldHamburger) oldHamburger.style.display = 'none';
      }
    }
  }

  /** Wire up any dark_mode buttons that don't already have an onclick */
  function wireThemeButtons() {
    document.querySelectorAll('button:not([data-theme-wired])').forEach(btn => {
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon && (icon.textContent.trim() === 'dark_mode' || icon.textContent.trim() === 'light_mode')) {
        btn.setAttribute('data-theme-wired', '1');
        btn.addEventListener('click', toggleTheme);
      }
    });
    // Sync the sidebar theme button state on load
    syncThemeBtn();
  }

  function syncThemeBtn() {
    const isDark = document.documentElement.classList.contains('dark');
    const mode = localStorage.getItem('theme') || 'system';

    // Sidebar theme label — show mode info
    const label = document.getElementById('ph-sb-theme-label');
    if (label) {
      if (mode === 'system') label.textContent = isDark ? 'Dark (System)' : 'Light (System)';
      else label.textContent = isDark ? 'Dark Mode' : 'Light Mode';
    }

    // Update ALL sun/moon SVG pairs (sidebar + topbar + floating)
    document.querySelectorAll('.ph-theme-svg-sun').forEach(el => el.style.display = isDark ? 'none' : 'block');
    document.querySelectorAll('.ph-theme-svg-moon').forEach(el => el.style.display = isDark ? 'block' : 'none');

    // Legacy: material icon buttons with dark_mode/light_mode text
    document.querySelectorAll('[data-theme-wired] .material-symbols-outlined, .ph-theme-icon').forEach(el => {
      el.textContent = isDark ? 'light_mode' : 'dark_mode';
    });

    // Dashboard-specific sun/moon pair (by ID)
    const dSun  = document.getElementById('dash-sun');
    const dMoon = document.getElementById('dash-moon');
    if (dSun)  dSun.style.display  = isDark ? 'none'  : 'block';
    if (dMoon) dMoon.style.display = isDark ? 'block' : 'none';

  }

  // ══ Page Transition System ══════════════════════════════════════════════════
  function initTransitions() {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 1. Create a progress bar if not exists
    let pb = document.getElementById('ph-progress-bar');
    if (!pb) {
      pb = document.createElement('div');
      pb.id = 'ph-progress-bar';
      document.body.appendChild(pb);
    }

    // Inject transition CSS dynamically
    const style = document.createElement('style');
    style.textContent = `
      .ph-page, .ph-main {
        animation: ph-page-enter 0.22s ease-out both;
        will-change: opacity, transform;
      }
      @keyframes ph-page-enter {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .ph-page-exit {
        opacity: 0 !important;
        transform: translateY(-6px) !important;
        transition: opacity 0.18s ease-in, transform 0.18s ease-in !important;
      }
      #ph-progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--ac, #6366f1) 0%, #a855f7 50%, var(--ac, #6366f1) 100%);
        background-size: 200% 100%;
        animation: ph-progress-pulse 2s infinite linear;
        z-index: 999999;
        width: 0;
        opacity: 0;
        transition: width 0.4s cubic-bezier(0.1, 0.8, 0.1, 1), opacity 0.2s ease-out;
        box-shadow: 0 0 8px var(--ac, #6366f1);
      }
      @keyframes ph-progress-pulse {
        0% { background-position: 0% 0%; }
        100% { background-position: 200% 0%; }
      }
    `;
    document.head.appendChild(style);

    // 2. Intercept local link clicks for smooth fadeout + progress animation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      // Only transition actual local pages (skip hashes, JS functions, or target="_blank")
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target === '_blank') return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // ignore modifier clicks

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return; // same origin only

        e.preventDefault();

        // Show progress bar
        pb.style.transition = 'width 0.4s cubic-bezier(0.1, 0.8, 0.1, 1)';
        pb.style.opacity = '1';
        pb.style.width = '75%';

        // Fade out current content page instead of body
        const pageEl = document.querySelector('.ph-page') || document.querySelector('.ph-main');
        if (pageEl) {
          pageEl.classList.add('ph-page-exit');
        }

        // Navigate to the link after the content completes fade-out (200ms)
        setTimeout(() => {
          pb.style.width = '100%';
          window.location.href = href;
        }, 200);
      } catch (err) {}
    });

    // In case browser back/forward cache is used, remove the exit class on page show
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        const pageEl = document.querySelector('.ph-page') || document.querySelector('.ph-main');
        if (pageEl) {
          pageEl.classList.remove('ph-page-exit');
        }
        pb.style.opacity = '0';
        pb.style.width = '0';
      }
    });
  }

  function initGlobalProfile(base) {
    if (document.getElementById('global-profile-modal')) return;

    // 1. Inject CSS Styles
    const style = document.createElement('style');
    style.textContent = `
      .gp-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 17, 23, 0.6);
        backdrop-filter: blur(12px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .gp-modal-container {
        width: 100%;
        max-width: 500px;
        background: var(--sf, #ffffff);
        border: 1px solid var(--bd, rgba(0, 0, 0, 0.08));
        border-radius: 24px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 85vh;
        animation: gp-modal-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        font-family: 'Inter', sans-serif;
      }
      html.dark .gp-modal-container {
        background: #171821;
        border-color: rgba(255, 255, 255, 0.08);
      }
      @keyframes gp-modal-enter {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .gp-modal-container button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);

    // 2. Inject DOM Elements
    const backdrop = document.createElement('div');
    backdrop.id = 'global-profile-modal';
    backdrop.className = 'gp-modal-backdrop';
    backdrop.style.display = 'none';
    backdrop.innerHTML = `
      <div class="gp-modal-container" id="gp-modal-container">
        <!-- Banner -->
        <div class="relative h-32 bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0" id="gp-banner-zone" style="position:relative;height:128px;background:linear-gradient(90deg, #6366f1 0%, #a855f7 100%)">
          <img id="gp-banner" style="display:none;width:100%;height:100%;object-fit:cover;">
          <button type="button" onclick="closeGlobalProfile()" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s;z-index:10;" onmouseover="this.style.background='rgba(0,0,0,0.6)'" onmouseout="this.style.background='rgba(0,0,0,0.4)'">
            <span class="material-symbols-outlined" style="font-size:16px;">close</span>
          </button>
        </div>

        <!-- Profile Header Info (Overlapping) -->
        <div style="padding:16px 24px;border-bottom:1px solid var(--bd, rgba(255,255,255,0.08));position:relative;flex-shrink:0;">
          <!-- Avatar container -->
          <div id="gp-avatar-container" style="position:absolute;top:-48px;left:24px;width:90px;height:90px;border-radius:50%;border:4px solid var(--sf,#fff);background:#6366f1;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff;font-size:28px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);overflow:hidden;">
            <img id="gp-avatar" style="display:none;width:100%;height:100%;object-fit:cover;">
            <span id="gp-initials">?</span>
          </div>

          <!-- Action Buttons -->
          <div id="gp-actions" style="display:flex;justify-content:flex-end;gap:8px;height:36px;align-items:center;">
            <!-- CONNECT, MESSAGE etc -->
          </div>

          <!-- Name and Meta -->
          <div style="margin-top:16px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <h3 id="gp-name" style="font-weight:800;font-size:18px;margin:0;color:var(--tx,#1f2937)">Student Name</h3>
              <span id="gp-status-dot" style="width:10px;height:10px;border-radius:50%;border:2px solid var(--sf,#fff);background:#9ca3af;display:inline-block" title="Offline"></span>
            </div>
            <p id="gp-university-major" style="font-size:12px;color:var(--tx-dim,#6b7280);margin:4px 0 8px 0;font-weight:500;">University · Major</p>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span id="gp-status-badge" style="display:none;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">AVAILABLE</span>
              <span id="gp-privacy-badge" style="display:none;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;background:rgba(99,102,241,0.1);color:#6366f1">PUBLIC</span>
            </div>
          </div>
        </div>

        <!-- Profile Details Body (Scrollable) -->
        <div style="padding:24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:20px;" id="gp-body">
          <!-- Bio -->
          <div id="gp-section-bio">
            <h4 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin:0 0 6px 0;">About</h4>
            <p id="gp-bio" style="font-size:13px;color:var(--tx,#374151);margin:0;line-height:1.5;white-space:pre-wrap;">No bio provided.</p>
          </div>

          <!-- Skills -->
          <div id="gp-section-skills">
            <h4 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin:0 0 8px 0;">Skills & Expertise</h4>
            <div id="gp-skills-list" style="display:flex;flex-wrap:wrap;gap:6px;">
              <!-- Badges -->
            </div>
          </div>

          <!-- Contact & Socials -->
          <div id="gp-section-contact">
            <h4 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin:0 0 8px 0;">Links & Contacts</h4>
            <div id="gp-socials" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <!-- Social rows -->
            </div>
          </div>

          <!-- Lock Screen State -->
          <div id="gp-lock-screen" style="display:none;padding:32px 16px;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;">
            <span class="material-symbols-outlined" style="font-size:48px;color:#9ca3af">lock</span>
            <div>
              <p style="font-weight:700;font-size:14px;margin:0;color:var(--tx,#1f2937)">This Profile is Private</p>
              <p style="font-size:12px;color:var(--tx-dim,#6b7280);margin:4px 0 0 0;line-height:1.4;">Send a connection request to see their university department, bio, skills, and projects.</p>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeGlobalProfile();
    });
  }

  async function showUserProfile(userId) {
    const modal = document.getElementById('global-profile-modal');
    if (!modal) return;

    // Show modal with loading state
    modal.style.display = 'flex';
    document.getElementById('gp-name').textContent = 'Loading...';
    document.getElementById('gp-university-major').textContent = '';
    document.getElementById('gp-status-badge').style.display = 'none';
    document.getElementById('gp-privacy-badge').style.display = 'none';
    document.getElementById('gp-bio').textContent = 'Loading details...';
    document.getElementById('gp-skills-list').innerHTML = '';
    document.getElementById('gp-socials').innerHTML = '';
    document.getElementById('gp-actions').innerHTML = '';
    document.getElementById('gp-lock-screen').style.display = 'none';
    document.getElementById('gp-section-bio').style.display = 'block';
    document.getElementById('gp-section-skills').style.display = 'block';
    document.getElementById('gp-section-contact').style.display = 'block';
    document.getElementById('gp-avatar').style.display = 'none';
    document.getElementById('gp-initials').style.display = 'inline';
    document.getElementById('gp-initials').textContent = '?';
    document.getElementById('gp-avatar-container').style.background = '#6366f1';
    document.getElementById('gp-banner').style.display = 'none';
    document.getElementById('gp-banner-zone').style.background = 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)';

    try {
      const tk = localStorage.getItem('access_token');
      const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? (location.port === '3000' ? 'http://localhost:5000' : '') : 'https://projecthive-backend.onrender.com';

      const r = await fetch(`${apiBase}/api/users/${userId}`, {
        headers: { Authorization: 'Bearer ' + tk }
      });
      if (!r.ok) throw new Error();
      const u = await r.json();

      const fn = u.firstName || u.first_name || '';
      const ln = u.lastName || u.last_name || '';
      const name = `${fn} ${ln}`.trim() || 'Anonymous User';
      const initials = ((fn[0]||'') + (ln[0]||'')).toUpperCase() || '?';

      document.getElementById('gp-name').textContent = name;

      // Status dot + activity text
      const dot = document.getElementById('gp-status-dot');
      const lastSeenVal = u.lastSeen || u.last_seen || '';
      if (u.onlineStatus === 'online') {
        dot.style.background = '#31A24C';
        dot.style.boxShadow = '0 0 0 3px rgba(49,162,76,.25)';
        dot.title = 'Active now';
      } else {
        dot.style.background = '#9ca3af';
        dot.style.boxShadow = 'none';
        // Calculate time-ago for tooltip
        if (lastSeenVal) {
          const diffMs = Date.now() - new Date(lastSeenVal).getTime();
          const diffMin = Math.floor(diffMs / 60000);
          const diffHr = Math.floor(diffMin / 60);
          const diffDay = Math.floor(diffHr / 24);
          if (diffMin < 1) dot.title = 'Active now';
          else if (diffMin < 60) dot.title = `Active ${diffMin}m ago`;
          else if (diffHr < 24) dot.title = `Active ${diffHr}h ago`;
          else if (diffDay === 1) dot.title = 'Active yesterday';
          else if (diffDay < 7) dot.title = `Active ${diffDay}d ago`;
          else dot.title = 'Offline';
        } else {
          dot.title = 'Offline';
        }
      }

      // Avatar
      const avContainer = document.getElementById('gp-avatar-container');
      const avImg = document.getElementById('gp-avatar');
      const avInitials = document.getElementById('gp-initials');
      if (u.avatar && u.avatar.startsWith('data:')) {
        avImg.src = u.avatar;
        avImg.style.display = 'block';
        avInitials.style.display = 'none';
        avContainer.style.background = 'transparent';
      } else {
        const colors = ['#6366f1','#7c3aed','#ec4899','#10b981','#f59e0b','#3b82f6'];
        let h = 0; for (const ch of name) h = ch.charCodeAt(0) + ((h << 5) - h);
        const avColor = u.avatarColor || colors[Math.abs(h) % colors.length];
        avInitials.textContent = initials;
        avInitials.style.display = 'inline';
        avImg.style.display = 'none';
        avContainer.style.background = avColor;
      }

      // Banner
      const bannerImg = document.getElementById('gp-banner');
      const bannerZone = document.getElementById('gp-banner-zone');
      if (u.bannerImage && u.bannerImage.startsWith('data:')) {
        bannerImg.src = u.bannerImage;
        bannerImg.style.display = 'block';
        bannerZone.style.background = '#000';
      } else {
        bannerImg.style.display = 'none';
        bannerZone.style.background = 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)';
      }

      // University / Major
      document.getElementById('gp-university-major').textContent = [u.university, u.major].filter(Boolean).join(' · ') || 'No academic institution listed';

      // Privacy Badge
      const privBadge = document.getElementById('gp-privacy-badge');
      privBadge.style.display = 'inline-block';
      privBadge.style.background = u.isPublic ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
      privBadge.style.color = u.isPublic ? '#10b981' : '#ef4444';
      privBadge.textContent = u.isPublic ? 'Public' : 'Private';

      // Availability Status Badge
      const statusBadge = document.getElementById('gp-status-badge');
      statusBadge.style.display = 'inline-block';
      if (u.status === 'available') {
        statusBadge.style.background = 'rgba(16,185,129,0.1)';
        statusBadge.style.color = '#10b981';
        statusBadge.textContent = 'Available for projects';
      } else if (u.status === 'busy') {
        statusBadge.style.background = 'rgba(245,158,11,0.1)';
        statusBadge.style.color = '#f59e0b';
        statusBadge.textContent = 'Busy';
      } else {
        statusBadge.style.background = 'rgba(156,163,175,0.1)';
        statusBadge.style.color = '#9ca3af';
        statusBadge.textContent = 'Not looking';
      }

      // Handle Lock screen for private profiles
      if (u.isLocked) {
        document.getElementById('gp-section-bio').style.display = 'none';
        document.getElementById('gp-section-skills').style.display = 'none';
        document.getElementById('gp-section-contact').style.display = 'none';
        document.getElementById('gp-lock-screen').style.display = 'flex';
      } else {
        document.getElementById('gp-lock-screen').style.display = 'none';

        // Bio
        document.getElementById('gp-bio').textContent = u.bio || 'No bio written yet.';

        // Skills
        const skillsList = document.getElementById('gp-skills-list');
        const skills = u.skills || [];
        if (skills.length > 0) {
          skillsList.innerHTML = skills.map(s => `<span style="padding:4px 10px;background:rgba(99,102,241,0.1);color:#6366f1;font-size:11px;font-weight:600;border-radius:8px;">${escapeHtml(s.name || s)}</span>`).join('');
        } else {
          skillsList.innerHTML = '<span style="font-size:11px;color:#9ca3af;">No skills listed.</span>';
        }

        // Socials / Contact
        const socials = document.getElementById('gp-socials');
        let socialsHtml = '';
        if (u.email) {
          socialsHtml += `<a href="mailto:${u.email}" style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.1);font-size:11px;color:var(--tx,#374151);text-decoration:none;font-weight:500;" class="hover-social"><span class="material-symbols-outlined" style="font-size:14px;color:#6366f1">mail</span> <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(u.email)}</span></a>`;
        }
        if (u.github) {
          socialsHtml += `<a href="${u.github}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.1);font-size:11px;color:var(--tx,#374151);text-decoration:none;font-weight:500;" class="hover-social"><span class="material-symbols-outlined" style="font-size:14px;color:#6366f1">code</span> <span>GitHub</span></a>`;
        }
        if (u.linkedin) {
          socialsHtml += `<a href="${u.linkedin}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.1);font-size:11px;color:var(--tx,#374151);text-decoration:none;font-weight:500;" class="hover-social"><span class="material-symbols-outlined" style="font-size:14px;color:#6366f1">work</span> <span>LinkedIn</span></a>`;
        }
        if (u.portfolio) {
          socialsHtml += `<a href="${u.portfolio}" target="_blank" style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.1);font-size:11px;color:var(--tx,#374151);text-decoration:none;font-weight:500;" class="hover-social"><span class="material-symbols-outlined" style="font-size:14px;color:#6366f1">language</span> <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Portfolio</span></a>`;
        }
        socials.innerHTML = socialsHtml || '<div style="grid-column:span 2;font-size:11px;color:#9ca3af;">No contact details listed.</div>';
      }

      // Action Buttons
      const actions = document.getElementById('gp-actions');
      const status = u.friendshipStatus;

      let actionsHtml = '';
      if (status === 'self') {
        actionsHtml = `<button onclick="location.href='/profile'" style="padding:6px 14px;background:#6366f1;color:#fff;border:none;font-weight:700;font-size:11px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:13px;">edit</span> Edit Profile</button>`;
      } else if (status === 'friends') {
        actionsHtml = `
          <button disabled style="padding:6px 14px;background:rgba(16,185,129,0.1);color:#10b981;border:1px solid rgba(16,185,129,0.2);font-weight:700;font-size:11px;border-radius:10px;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:13px;">check</span> Connected</button>
          <button onclick="location.href='/messages?chat=${userId}'" style="padding:6px 14px;background:#6366f1;color:#fff;border:none;font-weight:700;font-size:11px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:13px;">chat</span> Message</button>
        `;
      } else if (status === 'sent') {
        actionsHtml = `<button disabled style="padding:6px 14px;background:rgba(156,163,175,0.1);color:#9ca3af;border:1px solid rgba(156,163,175,0.2);font-weight:700;font-size:11px;border-radius:10px;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:13px;">schedule</span> Request Sent</button>`;
      } else if (status === 'received') {
        actionsHtml = `
          <button onclick="respondToRequest('${u.pendingReqId}', 'accept', '${userId}')" style="padding:6px 14px;background:#10b981;color:#fff;border:none;font-weight:700;font-size:11px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:13px;">check</span> Accept</button>
          <button onclick="respondToRequest('${u.pendingReqId}', 'reject', '${userId}')" style="padding:6px 14px;background:rgba(239,68,68,0.1);color:#ef4444;border:none;font-weight:700;font-size:11px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:13px;">close</span> Decline</button>
        `;
      } else {
        actionsHtml = `<button onclick="sendFriendRequestGlobal('${userId}')" style="padding:6px 14px;background:#6366f1;color:#fff;border:none;font-weight:700;font-size:11px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px;"><span class="material-symbols-outlined" style="font-size:13px;">person_add</span> Connect</button>`;
      }
      actions.innerHTML = actionsHtml;

    } catch (e) {
      document.getElementById('gp-name').textContent = 'Error';
      document.getElementById('gp-bio').textContent = 'Failed to load details.';
    }
  }

  function closeGlobalProfile() {
    const modal = document.getElementById('global-profile-modal');
    if (modal) modal.style.display = 'none';
  }

  async function sendFriendRequestGlobal(uid) {
    const btn = document.querySelector('#gp-actions button');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin material-symbols-outlined" style="font-size:13px;">progress_activity</span> Connecting...`;
    }
    try {
      const tk = localStorage.getItem('access_token');
      const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? (location.port === '3000' ? 'http://localhost:5000' : '') : 'https://projecthive-backend.onrender.com';
      const r = await fetch(`${apiBase}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + tk
        },
        body: JSON.stringify({ friendId: uid })
      });
      if (r.ok) {
        if (window.PHToast) PHToast.success('Friend request sent!');
        showUserProfile(uid); // Refresh modal state
      } else {
        if (window.PHToast) PHToast.error('Failed to send request');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:13px;">person_add</span> Connect`;
        }
      }
    } catch(e) {
      if (window.PHToast) PHToast.error('Server connection error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:13px;">person_add</span> Connect`;
      }
    }
  }

  async function respondToRequest(reqId, action, uid) {
    try {
      const tk = localStorage.getItem('access_token');
      const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? (location.port === '3000' ? 'http://localhost:5000' : '') : 'https://projecthive-backend.onrender.com';

      const endpoint = action === 'accept' ? `/api/friends/accept` : `/api/friends/decline`;
      const r = await fetch(apiBase + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + tk
        },
        body: JSON.stringify({ requestId: reqId })
      });
      if (r.ok) {
        if (window.PHToast) PHToast.success(action === 'accept' ? 'Connected successfully!' : 'Request declined');
        showUserProfile(uid); // Refresh modal state
      } else {
        if (window.PHToast) PHToast.error('Action failed');
      }
    } catch(e) {
      if (window.PHToast) PHToast.error('Server connection error');
    }
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  // Expose helper functions globally
  window.showUserProfile = showUserProfile;
  window.closeGlobalProfile = closeGlobalProfile;
  window.sendFriendRequestGlobal = sendFriendRequestGlobal;
  window.respondToRequest = respondToRequest;

  async function logout() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? (location.port === '3000' ? 'http://localhost:5000' : '')
      : 'https://projecthive-backend.onrender.com';

    if (accessToken) {
      try {
        await fetch(apiBase + '/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + accessToken,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (_) {
        // Local cleanup still signs the user out if the network is unavailable.
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('ph-user-cache');
    if (window.PHToast) PHToast.success('Signed out successfully');
    setTimeout(() => { window.location.href = '/login'; }, 350);
  }

  // ══ Premium Logout Confirmation Modal ══════════════════════════════════════
  function showLogoutModal() {
    let modal = document.getElementById('ph-logout-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ph-logout-modal';
      modal.innerHTML = `
        <div class="lo-card">
          <div class="lo-header">
            <div class="lo-icon">
              <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3 class="lo-title">Sign out of ProjectHive?</h3>
            <p class="lo-msg">You'll need to sign in again to access your account, messages, and projects.</p>
          </div>
          <div class="lo-actions">
            <button class="lo-btn lo-btn-cancel" id="ph-lo-cancel">Cancel</button>
            <button class="lo-btn lo-btn-confirm" id="ph-lo-confirm">Sign Out</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideLogoutModal();
      });
      document.getElementById('ph-lo-cancel').addEventListener('click', hideLogoutModal);
      document.getElementById('ph-lo-confirm').addEventListener('click', () => {
        hideLogoutModal();
        logout();
      });
    }
    requestAnimationFrame(() => modal.classList.add('active'));
  }

  function hideLogoutModal() {
    const modal = document.getElementById('ph-logout-modal');
    if (modal) modal.classList.remove('active');
  }

  // ══ Image Lightbox Component ══════════════════════════════════════════════
  function initLightbox() {
    if (document.getElementById('ph-lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'ph-lightbox';
    lb.innerHTML = `
      <div class="lb-toolbar">
        <button class="lb-btn" id="lb-download" title="Download image">
          <span class="material-symbols-outlined" style="font-size:20px">download</span>
        </button>
        <button class="lb-btn" id="lb-zoom" title="Zoom in/out">
          <span class="material-symbols-outlined" style="font-size:20px">zoom_in</span>
        </button>
        <button class="lb-btn" id="lb-close" title="Close">
          <span class="material-symbols-outlined" style="font-size:20px">close</span>
        </button>
      </div>
      <img id="lb-img" src="" alt="Preview">
    `;
    document.body.appendChild(lb);

    // Close
    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lb.classList.contains('active')) closeLightbox();
    });

    // Download with CORS compatibility / base64 support
    document.getElementById('lb-download').addEventListener('click', async () => {
      const img = document.getElementById('lb-img');
      if (!img.src) return;
      const originalSrc = img.src;
      try {
        if (originalSrc.startsWith('data:')) {
          // Base64 download
          const a = document.createElement('a');
          a.href = originalSrc;
          a.download = 'projecthive-attachment-' + Date.now() + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
        // Fetch URL as blob to bypass cross-origin browser navigation
        const response = await fetch(originalSrc);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        // Determine original extension or fallback to png
        let ext = 'png';
        const urlPath = originalSrc.split('?')[0];
        const match = urlPath.match(/\.(png|jpe?g|gif|webp|svg)/i);
        if (match) ext = match[1];
        a.download = 'projecthive-attachment-' + Date.now() + '.' + ext;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        console.warn('[Lightbox] Direct blob download failed, falling back to window.open', err);
        // Fallback: open in new tab with target _blank
        const a = document.createElement('a');
        a.href = originalSrc;
        a.download = 'projecthive-attachment-' + Date.now() + '.png';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });

    // Zoom toggle
    document.getElementById('lb-zoom').addEventListener('click', () => {
      lb.classList.toggle('zoomed');
      const icon = document.querySelector('#lb-zoom .material-symbols-outlined');
      icon.textContent = lb.classList.contains('zoomed') ? 'zoom_out' : 'zoom_in';
    });
  }

  function openLightbox(src) {
    const lb = document.getElementById('ph-lightbox');
    if (!lb) return;
    document.getElementById('lb-img').src = src;
    lb.classList.remove('zoomed');
    const icon = document.querySelector('#lb-zoom .material-symbols-outlined');
    if (icon) icon.textContent = 'zoom_in';
    requestAnimationFrame(() => lb.classList.add('active'));
  }

  function closeLightbox() {
    const lb = document.getElementById('ph-lightbox');
    if (lb) { lb.classList.remove('active'); lb.classList.remove('zoomed'); }
  }

  // Expose globally
  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;

  // ══ Global AI Popup (available on all authenticated pages) ════════════════
  function initGlobalAIPopup(showFab = true) {
    if (document.getElementById('ai-popup') || document.getElementById('ph-global-ai')) return;

    const wrap = document.createElement('div');
    wrap.id = 'ph-global-ai';
    wrap.innerHTML = `
      <div id="ai-fab-wrap">
        <button id="ai-fab-btn" type="button" title="AI Assistant" aria-label="Open AI Assistant"${!showFab ? ' style="display:none !important;"' : ''}>
          <span class="ai-fab-glow"></span>
          <svg id="ai-icon-open" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2L13.09 8.26L19 6L15.45 11.09L22 12L15.45 12.91L19 18L13.09 15.74L12 22L10.91 15.74L5 18L8.55 12.91L2 12L8.55 11.09L5 6L10.91 8.26L12 2Z"/></svg>
          <svg id="ai-icon-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="display:none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div id="ai-popup" class="ai-popup" role="dialog" aria-label="AI Assistant">
          <div class="ai-popup-hdr">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L13.09 8.26L19 6L15.45 11.09L22 12L15.45 12.91L19 18L13.09 15.74L12 22L10.91 15.74L5 18L8.55 12.91L2 12L8.55 11.09L5 6L10.91 8.26L12 2Z"/></svg>
              </div>
              <div>
                <div style="font-size:14px;font-weight:800;color:var(--tx,#0f172a)">ProjectHive AI</div>
                <div style="font-size:10px;color:#10b981;font-weight:600">● Online</div>
              </div>
            </div>
            <button type="button" id="ai-popup-close" aria-label="Close AI" style="background:none;border:none;cursor:pointer;color:var(--sub,#64748b);padding:8px;border-radius:8px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="ai-popup-msgs" id="ai-msgs">
            <div class="ai-msg ai-msg-bot">
              <div class="ai-msg-av">✨</div>
              <div class="ai-msg-bub">Hi <strong id="ai-greet">there</strong>! I'm your AI project assistant. Ask me anything!</div>
            </div>
          </div>
          <div class="ai-chips" id="ai-chips">
            <button type="button" class="ai-chip" data-q="Suggest a project idea for me">💡 Project idea</button>
            <button type="button" class="ai-chip" data-q="What tech should I learn in 2025?">🔧 Tech to learn</button>
            <button type="button" class="ai-chip" data-q="How do I find teammates?">👥 Find teammates</button>
          </div>
          <div class="ai-input-row">
            <textarea id="ai-input" class="ai-textarea" placeholder="Ask anything…" rows="1"></textarea>
            <button type="button" id="ai-send" class="ai-send" aria-label="Send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    try {
      const c = JSON.parse(localStorage.getItem('ph-user-cache') || 'null');
      const fn = c?.firstName || c?.first_name || 'there';
      const greet = document.getElementById('ai-greet');
      if (greet) greet.textContent = fn;
    } catch (_) {}

    let aiOpen = false;

    function setAIOpen(open) {
      aiOpen = open;
      document.getElementById('ai-popup')?.classList.toggle('open', open);
      document.getElementById('ai-fab-btn')?.classList.toggle('is-open', open);
      const iconOpen = document.getElementById('ai-icon-open');
      const iconClose = document.getElementById('ai-icon-close');
      if (iconOpen) iconOpen.style.display = open ? 'none' : 'block';
      if (iconClose) iconClose.style.display = open ? 'block' : 'none';
      const wrap = document.getElementById('ai-fab-wrap');
      if (wrap) { if (open) { wrap.style.setProperty('display', 'flex', 'important'); } else { wrap.style.removeProperty('display'); } }
      if (open) {
        document.body.classList.add('modal-open');
        setTimeout(() => document.getElementById('ai-input')?.focus(), 180);
      } else {
        document.body.classList.remove('modal-open');
      }
    }

    window.toggleAIPopup = function () {
      setAIOpen(!aiOpen);
    };

    document.getElementById('ai-fab-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.toggleAIPopup();
    });
    document.getElementById('ai-popup-close')?.addEventListener('click', () => setAIOpen(false));

    document.querySelectorAll('#ai-chips .ai-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.q || chip.textContent.trim();
        if (q) window.askAI?.(q);
      });
    });

    const aiInput = document.getElementById('ai-input');
    aiInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.sendAI?.();
      }
    });
    aiInput?.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    document.getElementById('ai-send')?.addEventListener('click', () => window.sendAI?.());

    function addAIMsg(html, role) {
      const msgs = document.getElementById('ai-msgs');
      if (!msgs) return;
      const d = document.createElement('div');
      d.className = 'ai-msg ai-msg-' + role;
      const av = document.createElement('div');
      av.className = 'ai-msg-av';
      av.textContent = role === 'bot' ? '✨' : ((JSON.parse(localStorage.getItem('ph-user-cache') || '{}').firstName || 'U')[0] || 'U').toUpperCase();
      const bub = document.createElement('div');
      bub.className = 'ai-msg-bub';
      bub.innerHTML = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      d.appendChild(av);
      d.appendChild(bub);
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    async function callGlobalAI(q) {
      const TK = localStorage.getItem('access_token');
      const H = { Authorization: 'Bearer ' + TK, 'Content-Type': 'application/json' };
      const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        ? (location.port === '3000' ? 'http://localhost:5000' : '')
        : 'https://projecthive-backend.onrender.com';
      try {
        const r = await fetch(API + '/api/ai/chat', { method: 'POST', headers: H, body: JSON.stringify({ message: q }) });
        const d = await r.json();
        if (r.ok && d.reply) return d.reply;
        if (r.status === 429) return '⏳ Rate limit reached. Please wait a few minutes.';
      } catch (_) {}
      return '⚠️ AI server unavailable. Try again shortly or visit the **AI Generator** page.';
    }

    window.askAI = async function (q) {
      document.getElementById('ai-chips').style.display = 'none';
      addAIMsg(q, 'user');
      const inp = document.getElementById('ai-input');
      const btn = document.getElementById('ai-send');
      if (inp) { inp.value = ''; inp.style.height = 'auto'; }
      if (btn) btn.disabled = true;
      const typing = document.createElement('div');
      typing.className = 'ai-msg ai-msg-bot';
      typing.id = 'ai-typing';
      typing.innerHTML = '<div class="ai-msg-av">✨</div><div class="ai-typing-dots"><span></span><span></span><span></span></div>';
      document.getElementById('ai-msgs')?.appendChild(typing);
      const ans = await callGlobalAI(q);
      document.getElementById('ai-typing')?.remove();
      addAIMsg(ans, 'bot');
      if (btn) btn.disabled = false;
      inp?.focus();
    };

    window.sendAI = function () {
      const q = document.getElementById('ai-input')?.value.trim();
      if (q) window.askAI(q);
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && aiOpen) setAIOpen(false);
    });
  }

  function toggleTheme() {
    // 3-state cycle: system → dark → light → system
    const current = localStorage.getItem('theme') || 'system';
    let next;
    if (current === 'system') {
      // Currently system → force dark
      next = 'dark';
    } else if (current === 'dark') {
      // Currently dark → force light
      next = 'light';
    } else {
      // Currently light → back to system
      next = 'system';
    }

    if (next === 'system') {
      localStorage.removeItem('theme');
      // Apply OS preference
      if (matchMedia('(prefers-color-scheme:dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (next === 'dark') {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
    syncThemeBtn();
  }

  function toggleCollapse() {
    const collapsed = document.documentElement.classList.toggle('sidebar-collapsed');
    localStorage.setItem('ph-sidebar-collapsed', collapsed ? 'true' : 'false');
  }

  // ── Backend Keep-Alive Ping ────────────────────────────────────────────────
  // Prevents Render.com free tier cold starts by pinging /health every 4 minutes
  function startKeepAlive() {
    const API_BASE = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? '' : 'https://projecthive-backend.onrender.com';
    const INTERVAL = 4 * 60 * 1000; // 4 minutes

    function ping() {
      fetch(API_BASE + '/health', { method: 'GET', cache: 'no-store' }).catch(() => {});
    }

    // Initial ping after 2 seconds (don't block page load)
    setTimeout(ping, 2000);
    // Then every 4 minutes
    setInterval(ping, INTERVAL);
  }

  // Auto-start keep-alive when sidebar initializes (i.e. user is on an authenticated page)
  function initConnectionMonitor() {
    let banner = document.getElementById('ph-conn-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'ph-conn-banner';
      banner.className = 'ph-conn-banner';
      document.body.appendChild(banner);
    }

    function showOffline() {
      banner.className = 'ph-conn-banner visible offline';
      banner.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">cloud_off</span><span>Connection lost. Reconnecting...</span>';
    }

    function showOnline() {
      banner.className = 'ph-conn-banner visible online';
      banner.innerHTML = '<span class="material-symbols-outlined" style="font-size: 18px;">cloud_done</span><span>Connected!</span>';
      setTimeout(() => {
        banner.classList.remove('visible');
      }, 2000);
    }

    window.addEventListener('offline', showOffline);
    window.addEventListener('online', showOnline);

    if (!navigator.onLine) {
      showOffline();
    }
  }

  const _origInit = init;
  function initWithKeepAlive(active, base) {
    _origInit(active, base);
    startKeepAlive();
    initLightbox();
    initConnectionMonitor();
    initGlobalAIPopup(active === 'dashboard');
    // D4: Restore sidebar collapse state from localStorage (desktop only)
    if (window.innerWidth >= 769 && localStorage.getItem('ph-sidebar-collapsed') === 'true') {
      document.documentElement.classList.add('sidebar-collapsed');
    }
  }

  return { init: initWithKeepAlive, logout, toggleTheme, openDrawer, closeDrawer, toggleCollapse, showUserProfile, closeGlobalProfile, sendFriendRequestGlobal, respondToRequest, showLogoutModal, openLightbox, closeLightbox, showComingSoon };
})();
