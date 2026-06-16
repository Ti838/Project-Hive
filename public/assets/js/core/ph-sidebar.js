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
    { group: null,      href: 'pages/user/dashboard.html',          key: 'dashboard',    icon: `<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>`, fill: 'currentColor', label: 'Dashboard' },
    { group: null,      href: 'pages/user/feed.html',               key: 'feed',         icon: `<path d="M2 3h20v18H2V3zm2 2v14h16V5H4zm2 3h12v2H6V8zm0 4h12v2H6v-2zm0 4h8v2H6v-2z"/>`, fill: 'currentColor', label: 'Feed' },
    { group: null,      href: 'pages/user/profile/edit.html',        key: 'profile',      icon: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`, label: 'Profile' },
    { group: null,      href: 'pages/user/messages.html',            key: 'messages',     icon: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`, label: 'Messages' },
    { group: null,      href: 'pages/user/notifications.html',       key: 'notifications',icon: `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`, label: 'Notifications' },
    { group: 'Discover',href: 'pages/user/teams.html',               key: 'teams',        icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`, label: 'Find Teams' },
    { group: null,      href: 'pages/user/people.html',              key: 'people',       icon: `<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>`, fill: 'currentColor', label: 'Find People' },
    { group: null,      href: 'pages/user/projects/showcase.html',   key: 'showcase',     icon: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`, label: 'Showcase' },
    { group: null,      href: 'pages/user/projects/generator.html',  key: 'generator',    icon: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`, label: 'AI Generator' },
    { group: 'Account', href: 'pages/user/settings.html',            key: 'settings',     icon: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`, label: 'Settings' },
  ];



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
      const href = base + item.href;
      html += `
        <a href="${href}" class="ph-sb-link${isActive ? ' active' : ''}" data-key="${item.key}">
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
      avEl.textContent = getInitials(fn, ln);
      avEl.style.background = getAvatarColor(name);
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
        ? '' : 'https://projecthive-backend.onrender.com';
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
        ? '' : 'https://projecthive-backend.onrender.com';
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

    // Logo goes to dashboard (not home)
    const isAdminPage = window.location.pathname.includes('/admin/');
    const logoHref = isAdminPage
      ? base + 'pages/admin/dashboard.html'
      : base + 'pages/user/dashboard.html';

    // Show cached user instantly — no flash of '?' or 'Loading...'
    let cachedName = 'Loading\u2026', cachedInitials = '?', cachedBg = '#6366f1', cachedRole = 'Student';
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
      }
    } catch(_) {}

    sidebar.innerHTML = `
      <button class="ph-sb-close-btn" id="ph-sb-close" aria-label="Close menu" onclick="PHSidebar.closeDrawer()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <a href="${logoHref}" class="ph-sb-brand">
        <div class="ph-sb-logo">
          <img src="${base}assets/svg/logo.png" alt="ProjectHive" onerror="this.parentElement.innerHTML='🐝'">
        </div>
        <div class="ph-sb-brand-txt">
          <div class="ph-sb-brand-name">ProjectHive</div>
          <div class="ph-sb-brand-sub">Premium Workspace</div>
        </div>
      </a>
      <div class="ph-sb-user">
        <div class="ph-sb-av" id="ph-sb-av" style="background:${cachedBg}">${IS_DEV ? '🔧' : cachedInitials}</div>
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
        <button class="ph-sb-signout" onclick="PHSidebar.logout()">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>`;

    loadUser(base);
    loadUnreadCount(base);
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

  function init(active, base = '../../') {
    // Theme init first (idempotent)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    const doRender = () => {
      render(active, base);
      buildOverlay();
      buildBottomNav(active, base); // ← NEW: premium mobile bottom nav
      injectHamburger(base);
      wireThemeButtons();
      initTransitions();   // ← page transitions
      initGlobalSearch(base); // ← NEW: global Ctrl+K search
    };

    if (document.readyState === 'loading') {
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
        window.location.href = `${base}pages/user/people.html?uid=${id}`;
      });
      appendGroup('Teams', teams, (id, base) => {
        window.location.href = `${base}pages/user/teams.html?tid=${id}`;
      });
      appendGroup('Showcase Projects', projects, (id, base) => {
        window.location.href = `${base}pages/user/projects/showcase.html?pid=${id}`;
      });
      appendGroup('Recent Posts', posts, (id, base) => {
        window.location.href = `${base}pages/user/feed.html?post=${id}`;
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
  }

  // ══ Premium Mobile Bottom Navigation Bar ═════════════════════════════════
  function buildBottomNav(active, base) {
    if (document.getElementById('ph-bottom-nav')) return; // already injected

    // 5 most important pages for mobile
    const items = [
      { key: 'dashboard', href: base + 'pages/user/dashboard.html', label: 'Home',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>` },
      { key: 'people', href: base + 'pages/user/people.html', label: 'People',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
      { key: 'messages', href: base + 'pages/user/messages.html', label: 'Messages',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
      { key: 'notifications', href: base + 'pages/user/notifications.html', label: 'Alerts',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
      { key: 'profile', href: base + 'pages/user/profile/edit.html', label: 'Profile',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    ];

    const nav = document.createElement('nav');
    nav.id = 'ph-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');
    nav.innerHTML = items.map(item => {
      const isActive = item.key === active;
      return `<a href="${item.href}" class="ph-bn-item${isActive ? ' active' : ''}" data-key="${item.key}" title="${item.label}">
        ${item.icon}
        <span>${item.label}</span>
      </a>`;
    }).join('');

    document.body.appendChild(nav);
  }

  /** Inject a hamburger button into the page topbar/header for mobile */
  function injectHamburger(base) {
    // Look for an existing hamburger slot first
    const slot = document.getElementById('ph-hamburger-slot');
    if (slot) {
      slot.innerHTML = `<button class="ph-hamburger" aria-label="Open menu" onclick="PHSidebar.openDrawer()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>`;
      return;
    }
    // Otherwise prepend to the first <header> on the page
    const header = document.querySelector('header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.className = 'ph-hamburger';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('id', 'ph-hamburger-btn');
    btn.setAttribute('onclick', 'PHSidebar.openDrawer()');
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>`;
    header.insertBefore(btn, header.firstChild);
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

    // Sidebar theme label
    const label = document.getElementById('ph-sb-theme-label');
    if (label) label.textContent = isDark ? 'Dark Mode' : 'Light Mode';

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

    // Auto-inject floating button on pages without one
    injectFloatingThemeBtn();
  }

  function injectFloatingThemeBtn() {
    // Skip if page already has its own theme button
    if (document.body?.getAttribute('data-no-float-theme')) return;
    // If page already has a #ph-float-theme btn, skip
    if (document.getElementById('ph-float-theme')) return;
    // Find any topbar / ph-topbar
    const topbar = document.querySelector('.ph-topbar') || document.querySelector('header');
    if (!topbar) return;
    // Check if topbar already has a theme btn
    if (topbar.querySelector('[data-theme-wired], .ph-topbar-theme')) return;

    const isDark = document.documentElement.classList.contains('dark');
    const btn = document.createElement('button');
    btn.id = 'ph-float-theme';
    btn.className = 'ph-topbar-theme';
    btn.title = 'Toggle dark/light mode';
    btn.setAttribute('data-theme-wired', '1');
    btn.innerHTML = `
      <svg class="ph-theme-svg-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:${isDark?'none':'block'}"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      <svg class="ph-theme-svg-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:${isDark?'block':'none'}"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.addEventListener('click', toggleTheme);
    topbar.appendChild(btn);
  }

  // ══ Page Transition System ══════════════════════════════════════════════════
  function initTransitions() {
    // 1) Always scroll to top on every page load
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 2) Create overlay div once
    if (!document.getElementById('ph-transition-overlay')) {
      const ov = document.createElement('div');
      ov.id = 'ph-transition-overlay';
      document.body.appendChild(ov);
    }

    // 3) Fade-in page content (opacity only — no translateY that shifts layout)
    const main = document.querySelector('.ph-page, main, .ph-main,
      body > div:not(#ph-sidebar):not(#ph-transition-overlay):not(#ph-mob-overlay)');
    if (main) main.classList.add('ph-page-ready');

    // 4) Intercept internal <a> clicks — fade out before navigating
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      // Skip: external, hash-only, javascript:, target=_blank
      if (!href || href.startsWith('http') || href.startsWith('#') ||
          href.startsWith('javascript') || a.target === '_blank') return;
      // Skip if already on same page
      if (a.classList.contains('active')) return;

      e.preventDefault();
      const overlay = document.getElementById('ph-transition-overlay');
      if (overlay) {
        overlay.classList.add('active');
        // Safety: if navigation fails, remove overlay after 1s
        const safety = setTimeout(() => overlay.classList.remove('active'), 1000);
        setTimeout(() => {
          clearTimeout(safety);
          window.location.href = href;
        }, 200);
      } else {
        window.location.href = href;
      }
    }, true);
  }

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    // Transition out before logout redirect
    const overlay = document.getElementById('ph-transition-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => { window.location.href = '/pages/auth/login.html'; }, 220);
    } else {
      window.location.href = '/pages/auth/login.html';
    }
  }

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    syncThemeBtn();
  }

  return { init, logout, toggleTheme, openDrawer, closeDrawer };
})();
