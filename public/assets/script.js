// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.primary-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Simple dropdowns (supports multiple)
document.querySelectorAll('.has-dropdown, .has-mega').forEach((host) => {
  const trigger = host.querySelector('.dropdown-trigger');
  if (!trigger) return;
  const openState = (open) => {
    host.classList.toggle('open', open);
    trigger.setAttribute('aria-expanded', String(open));
  };
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = host.classList.contains('open');
    // close others
    document.querySelectorAll('.has-dropdown.open, .has-mega.open').forEach(h => {
      if (h !== host) h.classList.remove('open');
    });
    openState(!isOpen);
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.has-dropdown.open, .has-mega.open').forEach(h => h.classList.remove('open'));
});

// Tabs (data-tabs)
document.querySelectorAll('[data-tabs]')?.forEach(tabs => {
  const tabButtons = tabs.querySelectorAll('[role="tab"]');
  const getPanel = (id) => document.getElementById(id);
  const allPanels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  const activate = (id) => {
    tabButtons.forEach(b => {
      const selected = b.getAttribute('aria-controls') === id;
      b.setAttribute('aria-selected', String(selected));
      b.classList.toggle('active', selected);
    });
    allPanels.forEach(p => p.hidden = p.id !== id);
    const target = getPanel(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };
  tabButtons.forEach(b => b.addEventListener('click', () => activate(b.getAttribute('aria-controls'))));
  const initial = (location.hash || '').slice(1) || tabButtons[0]?.getAttribute('aria-controls');
  if (initial) activate(initial);
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Smooth scroll to hash if present
window.addEventListener('DOMContentLoaded', () => {
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Logo marquee (robust JS fallback that restarts after content updates)
  const setupMarquee = () => {
    const row = document.querySelector('.logos .logo-row');
    if (!row || !row.children.length) return;
    // Disable CSS animation to avoid conflicts
    row.style.animation = 'none';
    // Duplicate exactly once for seamless loop
    if (!row.dataset.duplicated) { row.innerHTML = row.innerHTML + row.innerHTML; row.dataset.duplicated = '1'; }
    let x = 0; const speed = 40; // px/sec
    const loop = (ctx => (t) => {
      const dt = ctx.t ? (t - ctx.t) / 1000 : 0; ctx.t = t;
      x -= speed * dt; const half = row.scrollWidth / 2; if (half > 0 && x <= -half) x += half;
      row.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(loop(ctx));
    })({});
    requestAnimationFrame(loop);
  };
  setupMarquee();
  // If contentstack-sync rewrites the row, observe and re-init
  const logos = document.querySelector('.logos');
  if (logos) {
    const mo = new MutationObserver(() => setupMarquee());
    mo.observe(logos, { childList: true, subtree: true });
  }

  // Rewrite internal links from *.html to pretty URLs
  document.querySelectorAll('a[href]').forEach(a => {
    try {
      const raw = a.getAttribute('href');
      if (!raw || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
      // Ignore absolute external links
      const url = new URL(raw, location.origin);
      if (url.origin !== location.origin) return;
      // Ignore asset files and nested paths under /assets
      if (url.pathname.startsWith('/assets/')) return;
      if (url.pathname.endsWith('.html')) {
        const base = url.pathname.replace(/\\/g, '/');
        const pretty = base === '/index.html' ? '/' : `/${base.slice(1, -5)}`;
        const nextUrl = new URL(pretty + (url.search || '') + (url.hash || ''), location.origin);
        a.setAttribute('href', nextUrl.pathname + nextUrl.search + nextUrl.hash);
      }
    } catch (_) {
      // ignore malformed hrefs
    }
  });
});

// Plans billing toggle
const billingToggle = document.getElementById('billing-toggle');
if (billingToggle) {
  const applyPrices = (yearly) => {
    document.querySelectorAll('[data-price]').forEach(node => {
      const month = node.getAttribute('data-month');
      const year = node.getAttribute('data-year');
      const value = yearly && year ? year : month;
      node.textContent = value.startsWith('$') ? value : `$${value}`;
    });
    billingToggle.classList.toggle('active', yearly);
    billingToggle.setAttribute('aria-pressed', String(yearly));
  };
  let yearly = false;
  billingToggle.addEventListener('click', () => { yearly = !yearly; applyPrices(yearly); });
  applyPrices(false);
}

// Careers roles filter/search (if present)
let roleTeamFilter = 'all';
function setFilter(team, el){
  roleTeamFilter = team;
  document.querySelectorAll('.chip').forEach(c=>{ if(c.dataset && c.dataset.chip){ c.classList.toggle('active', c.dataset.chip===team || (team==='all' && c.dataset.chip==='all')); }});
  const input = document.querySelector('#rolesGrid') ? document.querySelector('input.search') : null;
  filterRoles(input ? input.value : '');
}
function filterRoles(q=''){
  const grid = document.getElementById('rolesGrid'); if(!grid) return;
  const norm = (q||'').toLowerCase();
  grid.querySelectorAll('.role').forEach(card=>{
    const team = card.getAttribute('data-team');
    const text = card.getAttribute('data-text')||'';
    const matchTeam = roleTeamFilter==='all' || roleTeamFilter===team;
    const matchText = !norm || text.includes(norm);
    card.style.display = (matchTeam && matchText) ? '' : 'none';
  });
}


