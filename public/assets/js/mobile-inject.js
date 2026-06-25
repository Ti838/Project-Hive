/**
 * ProjectHive Mobile CSS Auto-Injector
 * Automatically loads mobile-fixes.css if not already present
 * This ensures all pages are mobile responsive
 */

(function() {
  'use strict';

  // Check if mobile-fixes.css is already loaded
  const hasCSS = document.querySelector('link[href*="mobile-fixes.css"]');

  if (!hasCSS) {
    // Create and inject the mobile fixes stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/css/mobile-fixes.css';
    link.media = 'screen';
    link.id = 'mobile-fixes-auto';

    // Add to head
    document.head.appendChild(link);

    console.log('✅ Mobile fixes CSS injected automatically');
  } else {
    console.log('✅ Mobile fixes CSS already present');
  }

  // Additional mobile viewport fix
  let viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    // Ensure proper viewport settings
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
  } else {
    // Create viewport meta if missing
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
    document.head.appendChild(viewport);
    console.log('✅ Viewport meta tag added');
  }

  // Prevent zoom on input focus (iOS)
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.addEventListener('touchstart', function() {}, {passive: true});
  }

  // Add mobile class to body for JS-based detection
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-view');
  }

  // Update mobile class on resize
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
      document.body.classList.add('mobile-view');
    } else {
      document.body.classList.remove('mobile-view');
    }
  });

})();
