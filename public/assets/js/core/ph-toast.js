/**
 * ProjectHive — Toast Notification System
 * ph-toast.js
 *
 * Usage:
 *   PHToast.show('Message sent!');
 *   PHToast.show('Error occurred', 'error');
 *   PHToast.show('Saved!', 'success', 3000);
 *   PHToast.show('Heads up!', 'warning');
 *   PHToast.show('Info here', 'info');
 */

const PHToast = (() => {
  let container = null;

  const ICONS = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const COLORS = {
    success: { bg: '#10b981', border: '#059669' },
    error:   { bg: '#ef4444', border: '#dc2626' },
    warning: { bg: '#f59e0b', border: '#d97706' },
    info:    { bg: '#6366f1', border: '#4f46e5' },
  };

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'ph-toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: '1000000',
        maxWidth: '360px',
        pointerEvents: 'none',
      });
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 4000) {
    const c = getContainer();
    const color = COLORS[type] || COLORS.info;
    const icon  = ICONS[type]  || ICONS.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      background: ${color.bg};
      border: 1px solid ${color.border};
      color: #fff;
      padding: 12px 16px;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      pointer-events: all;
      cursor: pointer;
      opacity: 0;
      transform: translateX(20px);
      transition: opacity 0.25s, transform 0.25s;
      line-height: 1.4;
      word-break: break-word;
    `;

    toast.innerHTML = `
      <span style="flex-shrink:0">${icon}</span>
      <span style="flex:1">${message}</span>
      <button style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:16px;line-height:1;padding:0;margin-left:4px" aria-label="Dismiss">×</button>
    `;

    // Click to dismiss
    toast.addEventListener('click', () => dismiss(toast));
    toast.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss(toast);
    });

    c.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      });
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => dismiss(toast), duration);
    }

    return toast;
  }

  function dismiss(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 280);
  }

  // Convenience methods
  const success = (msg, duration) => show(msg, 'success', duration);
  const error   = (msg, duration) => show(msg, 'error',   duration);
  const warning = (msg, duration) => show(msg, 'warning', duration);
  const info    = (msg, duration) => show(msg, 'info',    duration);

  return { show, success, error, warning, info };
})();

window.PHToast = PHToast;
