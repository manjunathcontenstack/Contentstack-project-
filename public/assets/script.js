// Expose an initializer so SPA routes can re-run behaviors after content swap
window.initBehaviors = function initBehaviors(){
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.primary-nav');
  if (toggle && nav && !toggle.dataset.bound) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    toggle.dataset.bound = '1';
  }

  // Simple dropdowns (supports multiple)
  document.querySelectorAll('.has-dropdown, .has-mega').forEach((host) => {
    const trigger = host.querySelector('.dropdown-trigger');
    if (!trigger) return;
    const openState = (open) => {
      host.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', String(open));
    };
    if (!trigger.dataset.bound) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = host.classList.contains('open');
        // close others
        document.querySelectorAll('.has-dropdown.open, .has-mega.open').forEach(h => {
          if (h !== host) h.classList.remove('open');
        });
        openState(!isOpen);
      });
      trigger.dataset.bound = '1';
    }
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
    tabButtons.forEach(b => {
      if (!b.dataset.bound) {
        b.addEventListener('click', () => activate(b.getAttribute('aria-controls')));
        b.dataset.bound = '1';
      }
    });
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
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Logo marquee (fixed to prevent stack overflow)
  const setupMarquee = () => {
    const row = document.querySelector('.logos .logo-row');
    if (!row || !row.children.length) return;
    row.style.animation = 'none';
    if (!row.dataset.duplicated) { 
      row.innerHTML = row.innerHTML + row.innerHTML; 
      row.dataset.duplicated = '1'; 
    }
    let x = 0;
    const speed = 40; // px/sec
    let lastTime = 0;
    let animationId = null;
    const loop = (currentTime) => {
      if (lastTime === 0) lastTime = currentTime;
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      x -= speed * deltaTime;
      const halfWidth = row.scrollWidth / 2;
      if (halfWidth > 0 && x <= -halfWidth) {
        x += halfWidth;
      }
      row.style.transform = `translateX(${x}px)`;
      animationId = requestAnimationFrame(loop);
    };
    if (row.animationId) {
      cancelAnimationFrame(row.animationId);
    }
    animationId = requestAnimationFrame(loop);
    row.animationId = animationId;
  };
  setupMarquee();
  const logos = document.querySelector('.logos');
  if (logos) {
    const mo = new MutationObserver(() => setupMarquee());
    mo.observe(logos, { childList: true, subtree: true });
  }

  // Plans billing toggle
  const billingToggle = document.getElementById('billing-toggle');
  if (billingToggle && !billingToggle.dataset.bound) {
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
    billingToggle.dataset.bound = '1';
  }

  // Careers roles filter/search (if present)
  window.roleTeamFilter = 'all';
  window.setFilter = function setFilter(team){
    window.roleTeamFilter = team;
    document.querySelectorAll('.chip').forEach(c=>{ if(c.dataset && c.dataset.chip){ c.classList.toggle('active', c.dataset.chip===team || (team==='all' && c.dataset.chip==='all')); }});
    const input = document.querySelector('#rolesGrid') ? document.querySelector('input.search') : null;
    window.filterRoles(input ? input.value : '');
  };
  window.filterRoles = function filterRoles(q=''){
    const grid = document.getElementById('rolesGrid'); if(!grid) return;
    const norm = (q||'').toLowerCase();
    grid.querySelectorAll('.role').forEach(card=>{
      const team = card.getAttribute('data-team');
      const text = card.getAttribute('data-text')||'';
      const matchTeam = window.roleTeamFilter==='all' || window.roleTeamFilter===team;
      const matchText = !norm || text.includes(norm);
      card.style.display = (matchTeam && matchText) ? '' : 'none';
    });
  };

  // Initialize counter animations
  document.querySelectorAll('[data-count-to]').forEach(element => {
    const targetValue = parseInt(element.getAttribute('data-count-to'), 10) || 0;
    const duration = 1200;
    let startTime = null;
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentValue = Math.floor(progress * targetValue);
      element.textContent = currentValue;
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animateCount);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(element);
  });
};

// Initialize on classic static pages
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { try { window.initBehaviors(); } catch (e) {} });
} else {
  try { window.initBehaviors(); } catch (e) {}
}
