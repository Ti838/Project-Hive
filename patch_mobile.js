// patch_mobile.js — Apply full mobile optimizations to index.html
const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Fix the CSS media query block (add hamburger, mobile-nav, better responsive styles)
const oldMedia = `@media(max-width:640px){.nav-links .nav-link{display:none}.hero-stats{gap:20px}}`;

const newStyles = `/* ── MOBILE HAMBURGER ── */
.hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card);transition:all .15s;margin-left:8px}
.hamburger span{width:20px;height:2px;background:var(--txt);border-radius:2px;transition:all .3s;display:block}
.hamburger.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}
.hamburger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
.hamburger.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
/* ── MOBILE NAV DRAWER ── */
.mobile-nav{display:none;position:fixed;top:60px;left:0;right:0;background:var(--nav-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:16px 20px 20px;flex-direction:column;gap:8px;z-index:99;box-shadow:0 8px 32px rgba(0,0,0,.12)}
.mobile-nav.open{display:flex;animation:mnavIn .22s ease}
@keyframes mnavIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.mobile-nav .mnav-link{display:block;padding:13px 16px;font-size:15px;border-radius:12px;text-decoration:none;color:var(--txt);font-weight:500;transition:background .15s}
.mobile-nav .mnav-link:hover,.mobile-nav .mnav-link:active{background:var(--border)}
.mobile-nav .mnav-divider{height:1px;background:var(--border);margin:4px 0}
.mobile-nav .mnav-btn{display:flex;justify-content:center;align-items:center;gap:8px;padding:14px;font-size:15px;border-radius:13px;font-weight:600;cursor:pointer;border:none;text-decoration:none;transition:all .15s}
.mobile-nav .mnav-btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--txt)}
.mobile-nav .mnav-btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary2));color:#fff;box-shadow:0 4px 14px rgba(99,102,241,.3)}
/* ── MEDIA QUERIES ── */
@media(max-width:768px){
  .nav-links .nav-link,.nav-links a.btn,.nav-links .btn-ghost,.nav-links .btn-primary{display:none!important}
  .hamburger{display:flex}
  nav{padding:0 16px}
  .hero{padding:90px 16px 52px;min-height:auto}
  .hero h1{letter-spacing:-.5px}
  .hero-btns{flex-direction:column;align-items:center;gap:10px}
  .hero-btns .btn,.hero-btns a.btn{width:100%;max-width:320px;justify-content:center;padding:14px 20px!important;font-size:15px!important;border-radius:13px}
  .hero-stats{grid-template-columns:repeat(2,1fr)!important;gap:14px;margin-top:36px}
  .hero-stat .num{font-size:26px}
  section{padding:50px 16px}
  .features-grid{grid-template-columns:1fr!important;gap:14px}
  .feat-card{padding:22px}
  .cta-box{padding:42px 20px;border-radius:20px}
  .cta-box p{font-size:14px}
  .btn-white{width:100%;max-width:300px;justify-content:center;padding:14px 20px}
  footer{padding:24px 16px;font-size:12px}
  .orb1{width:200px;height:200px}
  .orb2{width:160px;height:160px}
}
@media(max-width:480px){
  .hero h1{font-size:clamp(28px,8vw,38px)!important}
  .hero p{font-size:14px}
  nav .nav-logo span{font-size:16px}
  .cta-section{padding:0 14px 52px}
}`;

html = html.replace(oldMedia, newStyles);

// 2. Fix hero-stats to be a CSS grid (already uses flex, change to grid via class)
html = html.replace(
  'class="hero-stats"',
  'class="hero-stats" style="display:grid;grid-template-columns:repeat(4,1fr)"'
);

// 3. Add hamburger button + mobile nav drawer after closing </nav>
const hamburgerHTML = `
<button class="hamburger" id="hamburger" onclick="toggleMobileNav()" aria-label="Open menu">
  <span></span><span></span><span></span>
</button>`;

// Insert hamburger into the nav-links div (before closing)
html = html.replace(
  '<div class="nav-links">',
  '<div class="nav-links" id="nav-links">'
);

// After </nav> insert mobile drawer
const mobileNavHTML = `
<div class="mobile-nav" id="mobile-nav">
  <a href="#features" class="mnav-link" onclick="closeMobileNav()">Features</a>
  <a href="#how" class="mnav-link" onclick="closeMobileNav()">How it Works</a>
  <div class="mnav-divider"></div>
  <a href="./pages/auth/login.html" class="mnav-btn mnav-btn-ghost">Login</a>
  <a href="./pages/auth/register.html" class="mnav-btn mnav-btn-primary">Sign Up Free</a>
</div>`;

// Add hamburger at end of nav-links before </div>
// Find </nav> and replace
html = html.replace(
  '</nav>',
  hamburgerHTML + '\n</nav>' + mobileNavHTML
);

// 4. Add hamburger JS functions before closing </script>
const jsAddition = `
// Mobile nav toggle
function toggleMobileNav(){
  const nav=document.getElementById('mobile-nav');
  const btn=document.getElementById('hamburger');
  const open=nav.classList.toggle('open');
  btn.classList.toggle('open',open);
  document.body.style.overflow=open?'hidden':'';
}
function closeMobileNav(){
  document.getElementById('mobile-nav').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow='';
}
// Close mobile nav on outside click
document.addEventListener('click',function(e){
  const nav=document.getElementById('mobile-nav');
  const btn=document.getElementById('hamburger');
  if(nav&&nav.classList.contains('open')&&!nav.contains(e.target)&&!btn.contains(e.target)){closeMobileNav();}
});
// Fix hero stats grid on mobile
(function(){
  const stats=document.querySelector('.hero-stats');
  if(stats)stats.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:48px';
})();`;

html = html.replace('</script>', jsAddition + '\n</script>');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Mobile patch applied to index.html successfully!');
