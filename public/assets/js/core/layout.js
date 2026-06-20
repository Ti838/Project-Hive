/**
 * ProjectHive — Shared Layout System v2
 * Handles: logo injection, theme toggle, sidebar injection
 */

// ══ Path resolver ══
const PH = {
  appName: 'ProjectHive',
  get base() {
    const d = (window.location.pathname.match(/\//g)||[]).length - 1;
    if (d <= 1) return './';
    if (d === 2) return '../';
    return '../../';
  },
};
Object.defineProperty(PH, 'logo', { get: () => '/favicon.png?v=2' });
Object.defineProperty(PH, 'svg',  { get: () => PH.base + 'assets/svg/' });

// ══ Theme ══
function phInitTheme() {
  const s = localStorage.getItem('theme');
  const dark = s === 'dark' || (!s && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}
function phToggleTheme() {
  const dark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  phUpdateThemeIcons();
}
function phUpdateThemeIcons() {
  const dark = document.documentElement.classList.contains('dark');
  document.querySelectorAll('[data-ph-theme-icon]').forEach(img => {
    img.src = PH.svg + (dark ? 'icon-sun.svg' : 'icon-moon.svg');
  });
}
phInitTheme();

// ══ Logo injection ══
function phApplyLogos() {
  document.querySelectorAll('[data-ph-logo]').forEach(img => { img.src = PH.logo; img.alt = PH.appName; });
  const fav = document.querySelector('link[rel="icon"]');
  if (fav) fav.href = PH.logo;
}

// ══ Sidebar builder ══
function phBuildSidebar(activePage) {
  const b = PH.base;
  const nav = [
    { href: b+'pages/dashboard.html',          icon: b+'assets/svg/icon-directory.svg', label: 'Dashboard',    key: 'dashboard' },
    { href: b+'pages/profile/edit.html',        icon: null, svgPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'My Profile', key: 'profile' },
    { href: b+'pages/messages.html',            icon: b+'assets/svg/icon-message.svg', label: 'Messages',      key: 'messages' },
    { href: b+'pages/notifications.html',       icon: b+'assets/svg/icon-bell.svg', label: 'Notifications',   key: 'notifications' },
    { section: 'Discover' },
    { href: b+'pages/teams/index.html',         icon: b+'assets/svg/icon-teamwork.svg', label: 'Find Teams',  key: 'teams' },
    { href: b+'pages/projects/showcase.html',   icon: b+'assets/svg/icon-trophy.svg', label: 'Showcase',     key: 'showcase' },
    { href: b+'pages/projects/generator.html',  icon: b+'assets/svg/icon-lightbulb.svg', label: 'AI Generator', key: 'generator' },
    { section: 'Account' },
    { href: b+'pages/settings.html',            icon: null, svgPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z', label: 'Settings', key: 'settings' },
  ];

  function mkIcon(item) {
    if (item.icon) return `<img src="${item.icon}" style="width:16px;height:16px;opacity:.7;flex-shrink:0" alt="">`;
    return `<svg style="width:16px;height:16px;opacity:.7;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.svgPath}"/></svg>`;
  }

  const navHTML = nav.map(item => {
    if (item.section) return `<p class="ph-nav-section">${item.section}</p>`;
    const active = item.key === activePage ? 'active' : '';
    return `<a href="${item.href}" class="ph-nav-link ${active}">${mkIcon(item)} ${item.label}</a>`;
  }).join('');

  return `
    <div class="ph-brand">
      <img data-ph-logo src="${PH.logo}" alt="ProjectHive" style="width:42px;height:42px;object-fit:contain;border-radius:12px;box-shadow:0 0 12px rgba(99,102,241,.35);flex-shrink:0">
      <div>
        <div class="ph-brand-name">ProjectHive</div>
        <div class="ph-brand-sub">Student Platform</div>
      </div>
    </div>
    <div style="padding:12px 10px;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px">
        <div id="sb-user-av" style="width:34px;height:34px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;border:2px solid rgba(99,102,241,.3)">?</div>
        <div style="min-width:0;flex:1">
          <div id="sb-user-name" style="font-size:13px;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Loading…</div>
          <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
            <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0"></span>
            <span style="font-size:11px;color:var(--muted)">Online</span>
          </div>
        </div>
      </div>
    </div>
    <nav class="ph-nav">${navHTML}</nav>
    <div style="padding:10px;border-top:1px solid var(--border)">
      <button onclick="if(confirm('Logout?'))Auth.logout()" class="ph-nav-link" style="color:#ef4444;width:100%">
        <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Logout
      </button>
    </div>`;

}

// Mobile drawer HTML
function phBuildDrawer(activePage) {
  return `
  <div id="ph-drawer-overlay" class="ph-drawer-overlay" onclick="phCloseDrawer()"></div>
  <div id="ph-drawer" class="ph-drawer">
    ${phBuildSidebar(activePage)}
  </div>`;
}

// ══ Mount sidebar + drawer on page ══
function phMount(activePage) {
  const root = document.getElementById('ph-sidebar-root');
  if (root) root.innerHTML = phBuildSidebar(activePage);
  const drawerRoot = document.getElementById('ph-drawer-root');
  if (drawerRoot) drawerRoot.innerHTML = phBuildDrawer(activePage);

  // Load user name into sidebar
  try {
    const u = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (u) {
      const name = `${u.firstName||''} ${u.lastName||''}`.trim() || 'Student';
      const ini  = ((u.firstName?.[0]||'')+(u.lastName?.[0]||'')).toUpperCase() || '?';
      const nameEl = document.getElementById('sb-user-name');
      const avEl   = document.getElementById('sb-user-av');
      if (nameEl) nameEl.textContent = name;
      if (avEl)   avEl.textContent   = ini;
    }
  } catch(e) {}

  phApplyLogos();
  phUpdateThemeIcons();
}

function phOpenDrawer()  { document.getElementById('ph-drawer')?.classList.add('open');    document.getElementById('ph-drawer-overlay')?.style && (document.getElementById('ph-drawer-overlay').style.display='block'); }
function phCloseDrawer() { document.getElementById('ph-drawer')?.classList.remove('open'); if(document.getElementById('ph-drawer-overlay')) document.getElementById('ph-drawer-overlay').style.display='none'; }

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { phApplyLogos(); phUpdateThemeIcons(); });
} else { phApplyLogos(); phUpdateThemeIcons(); }

window.PH = PH;
window.phToggleTheme  = phToggleTheme;
window.phMount        = phMount;
window.phOpenDrawer   = phOpenDrawer;
window.phCloseDrawer  = phCloseDrawer;
