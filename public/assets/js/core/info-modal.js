/**
 * ProjectHive — Centralized Info Modal System
 * Include this script on ANY page to enable modal popups for About, Help, Privacy, Terms.
 * Usage: <script src="/assets/js/core/info-modal.js"></script>
 *        Then call openInfoModal('about') / openInfoModal('terms') etc.
 *        Or add href="/terms" / href="/privacy" links — they auto-wire.
 */
(function () {
  if (window.__PH_INFO_MODAL_LOADED) return;
  window.__PH_INFO_MODAL_LOADED = true;

  // ── Content Data ──
  const DATA = {
    about: {
      title: 'About ProjectHive',
      icon: 'hive', gradient: 'linear-gradient(135deg,#6366f1,#7c3aed)', link: '/about',
      body: `
        <p>ProjectHive is a student collaboration platform built to connect university students across Bangladesh — find teammates, share achievements, and build amazing projects together.</p>
        <h3><span class="material-symbols-outlined">stars</span> Our Mission</h3>
        <p>We believe the best projects are built by diverse teams. ProjectHive was created to solve a common problem — university students often struggle to find the right teammates for hackathons, thesis projects, and startup ideas.</p>
        <h3><span class="material-symbols-outlined">grid_view</span> Key Features</h3>
        <ul>
          <li><strong>Social Feed</strong> — Share achievements, updates, and connect with the community</li>
          <li><strong>Team Builder</strong> — Create teams, invite members, and collaborate</li>
          <li><strong>AI Generator</strong> — Generate project ideas, READMEs, and descriptions</li>
          <li><strong>Real-time Chat</strong> — Message teammates with online status</li>
          <li><strong>Project Showcase</strong> — Showcase projects with tech stacks and live links</li>
          <li><strong>Find People</strong> — Discover students from other universities</li>
        </ul>
        <h3><span class="material-symbols-outlined">diversity_3</span> Built By Students</h3>
        <p>ProjectHive is built and maintained by passionate CS students who understand the challenges of academic collaboration.</p>`
    },
    privacy: {
      title: 'Privacy Policy',
      icon: 'shield', gradient: 'linear-gradient(135deg,#10b981,#059669)', link: '/privacy',
      body: `
        <p style="font-size:11px;opacity:.6;margin-bottom:14px"><em>Last updated: June 1, 2026</em></p>
        <h3><span class="material-symbols-outlined">database</span> Information We Collect</h3>
        <table><tr><th>Data</th><th>Why</th></tr>
        <tr><td><strong>Account Info</strong> — Name, email, password (hashed)</td><td>Account management</td></tr>
        <tr><td><strong>Profile</strong> — Bio, skills, avatar, social links</td><td>Public profile</td></tr>
        <tr><td><strong>Content</strong> — Posts, messages, projects</td><td>Platform features</td></tr>
        <tr><td><strong>Usage</strong> — Login timestamps</td><td>Improvements</td></tr></table>
        <h3><span class="material-symbols-outlined">lock</span> Data Security</h3>
        <ul>
          <li>Passwords hashed with <strong>bcrypt</strong></li>
          <li>API protected with <strong>JWT authentication</strong></li>
          <li>All data over <strong>HTTPS encryption</strong></li>
          <li>Database <strong>Row Level Security (RLS)</strong></li>
        </ul>
        <h3><span class="material-symbols-outlined">visibility</span> Your Controls</h3>
        <ul>
          <li>Profile visibility — public or private</li>
          <li>Email visibility — show/hide on profile</li>
          <li>Online status — show/hide from friends</li>
          <li>Discoverability — appear in search or not</li>
        </ul>
        <h3><span class="material-symbols-outlined">delete</span> Data Deletion</h3>
        <p>Delete your account anytime from <a href="/settings">Settings → Danger Zone</a>. Data removed within 30 days.</p>
        <p>We do <strong>not sell your data</strong>. No third-party tracking cookies.</p>`
    },
    terms: {
      title: 'Terms of Service',
      icon: 'gavel', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', link: '/terms',
      body: `
        <p style="font-size:11px;opacity:.6;margin-bottom:14px"><em>Last updated: June 1, 2026</em></p>
        <h3><span class="material-symbols-outlined">check_circle</span> Acceptance</h3>
        <p>By creating an account, you confirm you are at least <strong>16 years old</strong> and agree to these terms.</p>
        <h3><span class="material-symbols-outlined">person</span> User Accounts</h3>
        <ul>
          <li>Provide <strong>accurate information</strong> when registering</li>
          <li>Maintain <strong>password security</strong> — don't share credentials</li>
          <li>One person = <strong>one account</strong></li>
          <li>Must be a <strong>university student</strong> or recent graduate</li>
        </ul>
        <h3><span class="material-symbols-outlined">edit_note</span> User Content</h3>
        <p>You own your content. By posting, you grant us a license to display it on the platform. Do not post illegal, harmful, or misleading content.</p>
        <h3><span class="material-symbols-outlined">block</span> Prohibited Activities</h3>
        <ul>
          <li>Hacking, exploiting, or disrupting the platform</li>
          <li>Using bots or scrapers</li>
          <li>Impersonating others</li>
          <li>Harassment, bullying, or discrimination</li>
          <li>Posting commercial ads without approval</li>
        </ul>
        <h3><span class="material-symbols-outlined">shield</span> Intellectual Property</h3>
        <p>ProjectHive code and design are protected by copyright.</p>
        <h3><span class="material-symbols-outlined">warning</span> Disclaimer</h3>
        <p>Platform provided <strong>"as is"</strong>. We may suspend accounts that violate these terms.</p>
        <h3><span class="material-symbols-outlined">mail</span> Contact</h3>
        <p>Questions? Email <strong>support@projecthive.com</strong></p>`
    }
  };

  // ── Inject CSS ──
  const style = document.createElement('style');
  style.textContent = `
    .ph-im-backdrop{position:fixed;inset:0;z-index:999999;background:rgba(15,17,23,.6);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;pointer-events:none;transition:opacity .2s ease}
    .ph-im-backdrop.open{opacity:1;pointer-events:all}
    .ph-im{width:100%;max-width:560px;max-height:85vh;background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.2);overflow:hidden;transform:scale(.93) translateY(16px);transition:transform .25s cubic-bezier(.34,1.56,.64,1);display:flex;flex-direction:column}
    .ph-im-backdrop.open .ph-im{transform:scale(1) translateY(0)}
    html.dark .ph-im{background:#1a1b27;border-color:rgba(255,255,255,.08);box-shadow:0 24px 60px rgba(0,0,0,.55)}
    .ph-im-head{display:flex;align-items:center;gap:12px;padding:20px 24px 16px;border-bottom:1px solid #e2e8f0}
    html.dark .ph-im-head{border-color:rgba(255,255,255,.06)}
    .ph-im-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .ph-im-ic .material-symbols-outlined{font-size:20px;color:#fff}
    .ph-im-head h2{font-size:17px;font-weight:800;flex:1;color:#0f172a}
    html.dark .ph-im-head h2{color:#f1f5f9}
    .ph-im-x{width:32px;height:32px;border-radius:8px;border:none;background:#f1f5f9;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0}
    .ph-im-x:hover{background:rgba(239,68,68,.1)}
    html.dark .ph-im-x{background:rgba(255,255,255,.06)}
    .ph-im-x .material-symbols-outlined{font-size:18px;color:#64748b}
    .ph-im-body{overflow-y:auto;padding:20px 24px 28px;flex:1}
    .ph-im-body h3{font-size:14px;font-weight:700;margin:20px 0 8px;display:flex;align-items:center;gap:6px;color:#0f172a}
    html.dark .ph-im-body h3{color:#f1f5f9}
    .ph-im-body h3:first-child{margin-top:0}
    .ph-im-body h3 .material-symbols-outlined{font-size:17px;color:#6366f1}
    .ph-im-body p,.ph-im-body li{font-size:13px;color:#64748b;line-height:1.75;margin-bottom:8px}
    html.dark .ph-im-body p,html.dark .ph-im-body li{color:#94a3b8}
    .ph-im-body ul{padding-left:18px;margin-bottom:12px}
    .ph-im-body li{margin-bottom:4px}
    .ph-im-body strong{color:#0f172a}
    html.dark .ph-im-body strong{color:#e2e8f0}
    .ph-im-body a{color:#6366f1;font-weight:600;text-decoration:none}
    .ph-im-body table{width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:12px}
    .ph-im-body th,.ph-im-body td{text-align:left;padding:10px 12px;border:1px solid #e2e8f0}
    html.dark .ph-im-body th,html.dark .ph-im-body td{border-color:rgba(255,255,255,.06)}
    .ph-im-body th{background:#f1f5f9;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
    html.dark .ph-im-body th{background:rgba(255,255,255,.04)}
    .ph-im-foot{padding:12px 24px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between}
    html.dark .ph-im-foot{border-color:rgba(255,255,255,.06)}
    .ph-im-foot a{font-size:12px;color:#6366f1;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:4px}
    .ph-im-foot>span{font-size:11px;color:#94a3b8}
  `;
  document.head.appendChild(style);

  // ── Inject Modal HTML ──
  const modal = document.createElement('div');
  modal.className = 'ph-im-backdrop';
  modal.id = 'ph-im-backdrop';
  modal.addEventListener('click', e => { if (e.target === modal) closeInfoModal(); });
  modal.innerHTML = `
    <div class="ph-im">
      <div class="ph-im-head">
        <div class="ph-im-ic" id="ph-im-ic"></div>
        <h2 id="ph-im-title"></h2>
        <button class="ph-im-x" onclick="closeInfoModal()" title="Close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="ph-im-body" id="ph-im-body"></div>
      <div class="ph-im-foot">
        <a href="#" id="ph-im-link" target="_blank"><span class="material-symbols-outlined" style="font-size:14px">open_in_new</span> Open full page</a>
        <span><img src="/favicon.png?v=2" alt="" style="width:11px;height:11px;border-radius:2px;vertical-align:middle"> ProjectHive</span>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // ── Open / Close ──
  window.openInfoModal = function (key) {
    const d = DATA[key];
    if (!d) return;
    document.getElementById('ph-im-ic').innerHTML = '<span class="material-symbols-outlined">' + d.icon + '</span>';
    document.getElementById('ph-im-ic').style.background = d.gradient;
    document.getElementById('ph-im-title').textContent = d.title;
    document.getElementById('ph-im-body').innerHTML = d.body;
    document.getElementById('ph-im-link').href = d.link;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeInfoModal = function () {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfoModal(); });

  // ── Auto-wire links ──
  // Any <a href="/terms">, <a href="/privacy">, <a href="/about">, <a href="/help">
  // on the SAME page will be intercepted and shown as modal instead
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const map = { '/about': 'about', '/terms': 'terms', '/privacy': 'privacy' };
    const key = map[href];
    if (key && !a.hasAttribute('data-no-modal') && a.target !== '_blank') {
      e.preventDefault();
      openInfoModal(key);
    }
  });
})();
