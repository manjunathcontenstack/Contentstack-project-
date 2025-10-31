(function(){
  const API_HOST = 'https://cdn.contentstack.io';
  const API_KEY = 'blt979982b3ad227a1d';
  const DELIVERY_TOKEN = 'cs4a3fe30dbd2e57d4efb25c6a';
  const ENVIRONMENT = 'development';
  const LOCALE = 'en-us';

  async function fetchJSON(url){
    const sep = url.includes('?') ? '&' : '?';
    const full = `${API_HOST}/v3${url}${sep}locale=${encodeURIComponent(LOCALE)}&ts=${Date.now()}&cache_bust=${Math.random()}`;
    const res = await fetch(full, {
      headers: { 
        'api_key': API_KEY, 
        'access_token': DELIVERY_TOKEN,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  }

  async function fetchAssetUrl(assetUid){
    try {
      const data = await fetchJSON(`/assets/${encodeURIComponent(assetUid)}?environment=${encodeURIComponent(ENVIRONMENT)}`);
      const url = data?.asset?.url || data?.url || data?.asset?.file?.url;
      return normalizeAssetUrl(url);
    } catch (_) {
      return null;
    }
  }

  function getBlock(entry, uid){
    const blocks = Array.isArray(entry.page_sections) ? entry.page_sections : [];
    return blocks.map(b => b[uid]).find(Boolean);
  }

  function applyHome(entry){
    try {
      // Announcement
      const ann = getBlock(entry, 'announcement_bar');
      if (ann && ann.enabled) {
        const bar = document.querySelector('.announce .container span');
        if (bar && ann.text) bar.textContent = ann.text;
      }
      // Hero
      const hero = getBlock(entry, 'hero');
      if (hero) {
        const h1 = document.querySelector('section.hero h1');
        const cta = document.querySelector('section.hero .hero-cta a');
        if (h1 && hero.headline) h1.textContent = hero.headline;
        if (cta && hero.primary_cta) {
          if (hero.primary_cta.label) cta.textContent = hero.primary_cta.label;
          if (hero.primary_cta.href) cta.setAttribute('href', hero.primary_cta.href);
        }
      }
      // Roles (3)
      const roles = getBlock(entry, 'roles');
      if (roles && Array.isArray(roles.cards)) {
        document.querySelectorAll('section.roles .card-grid .role-card').forEach((card, i) => {
          const item = roles.cards[i]; if (!item) return;
          const h3 = card.querySelector('h3');
          const p = card.querySelector('p');
          const a = card.querySelector('a.link');
          const art = card.querySelector('.role-art');
          if (h3 && item.title) h3.textContent = item.title;
          if (p && item.description) p.textContent = item.description;
          if (a && item.link) {
            if (item.link.label) a.textContent = item.link.label;
            if (item.link.href) a.setAttribute('href', item.link.href);
          }
          if (art && item.image && (item.image.url || item.image.file?.url)) {
            const url = item.image.url || item.image.file.url;
            art.style.backgroundImage = `url(${url})`;
            art.style.backgroundSize = 'cover';
            art.style.backgroundPosition = 'center';
          }
        });
      }
      // Success cards (3)
      const success = getBlock(entry, 'success_cards');
      if (success && Array.isArray(success.cards)) {
        const cards = document.querySelectorAll('section.success .success-grid .success-card');
        cards.forEach((card, i) => {
          const item = success.cards[i]; if (!item) return;
          const num = card.querySelector('.metric .num');
          const unit = card.querySelector('.metric');
          const label = card.querySelector('.metric .label');
          const p = card.querySelector('p.muted');
          const a = card.querySelector('a.link');
          if (num && item.value) num.setAttribute('data-count-to', String(parseInt(item.value, 10) || item.value));
          if (label && item.label) label.textContent = item.label;
          if (unit && item.unit) unit.innerHTML = `${num ? num.outerHTML : ''}${item.unit}<span class="label">${item.label||''}</span>`;
          if (p && item.description) p.textContent = item.description;
          if (a && item.link) {
            if (item.link.label) a.textContent = item.link.label;
            if (item.link.href) a.setAttribute('href', item.link.href);
          }
        });
      }
      // Metrics
      const metrics = getBlock(entry, 'metrics');
      if (metrics && Array.isArray(metrics.metric)) {
        // Optional: could inject elsewhere if needed
      }
      // Logo carousel → pills
      const logos = getBlock(entry, 'logo_carousel');
      if (logos && Array.isArray(logos.brands)) {
        const row = document.querySelector('section.logos .logo-row');
        if (row) {
          row.innerHTML = '';
          logos.brands.forEach(b => { const d = document.createElement('div'); d.className='logo-pill'; d.textContent = (b.title||b.name||'').trim() || 'Brand'; row.appendChild(d); });
          // Duplicate content to enable seamless marquee loop
          const original = row.innerHTML;
          row.innerHTML = original + original;
        }
      }
      // Analyst recognition
      const ar = getBlock(entry, 'analyst_recognition');
      if (ar) {
        const h2 = document.querySelector('section.analyst h2'); if (h2 && ar.title) h2.textContent = ar.title;
        const cards = document.querySelectorAll('section.analyst .analyst-card');
        if (cards.length && Array.isArray(ar.badges)) {
          cards.forEach((card, i) => {
            const b = ar.badges[i]; if (!b) return;
            const h3 = card.querySelector('h3'); const tag = card.querySelector('.tag'); const p = card.querySelector('p.muted');
            if (h3 && (b.label || b.provider)) h3.textContent = b.label || b.provider;
            if (tag && b.provider) tag.textContent = b.provider;
            if (p && !p.textContent) p.textContent = 'Recognized for excellence.';
          });
        }
      }
      // Quick links
      const ql = getBlock(entry, 'quick_links');
      if (ql && Array.isArray(ql.links)) {
        const anchors = document.querySelectorAll('section.actions .action-grid a.action-card');
        anchors.forEach((a, i) => {
          const link = ql.links[i]; if (!link) return;
          const h3 = a.querySelector('h3');
          if (h3 && link.label) h3.textContent = link.label;
          if (link.href) a.setAttribute('href', link.href);
        });
      }
      // Why
      const why = getBlock(entry, 'why');
      if (why && Array.isArray(why.cards)) {
        const cards = document.querySelectorAll('section.why .why-grid .why-card');
        cards.forEach((card, i) => {
          const item = why.cards[i]; if (!item) return;
          const h3 = card.querySelector('h3');
          const p = card.querySelector('p');
          if (h3 && item.title) h3.textContent = item.title;
          if (p && item.body) p.textContent = item.body;
        });
      }
      // Bottom CTA
      const bcta = getBlock(entry, 'bottom_cta');
      if (bcta) {
        const h2 = document.querySelector('section.cta-banner h2');
        const p = document.querySelector('section.cta-banner p.muted');
        const buttons = document.querySelectorAll('section.cta-banner .cta-row a');
        if (h2 && bcta.title) h2.textContent = bcta.title;
        if (p && bcta.subtitle) p.textContent = bcta.subtitle;
        if (Array.isArray(bcta.ctas) && bcta.ctas.length) {
          bcta.ctas.forEach((c, i) => { const a = buttons[i]; if (a) { if (c.label) a.textContent = c.label; if (c.href) a.href = c.href; } });
        } else if (bcta.cta) {
          const a = buttons[0]; if (a) { if (bcta.cta.label) a.textContent = bcta.cta.label; if (bcta.cta.href) a.href = bcta.cta.href; }
        }
      }
    } catch (_) {}
  }

  function applyPlatform(entry){
    try {
      const hero = getBlockByKey(entry, 'hero');
      if (hero) {
        const h1 = document.querySelector('section.hero h1');
        if (h1 && (hero.headline || entry.title)) h1.textContent = hero.headline || entry.title;
        const cta = document.querySelector('section.hero .hero-cta a');
        if (cta && hero.cta) { if (hero.cta.label) cta.textContent = hero.cta.label; if (hero.cta.href) cta.href = hero.cta.href; }
      }
      const sections = Array.isArray(entry.page_sections) ? entry.page_sections : [];
      sections.forEach(blk => {
        if (blk.feature_section) {
          const fs = blk.feature_section;
          const id = fs.anchor_id ? `#cap-${fs.anchor_id}` : null;
          const host = id ? document.querySelector(id) : null;
          if (!host) return;
          const h2 = host.querySelector('h2'); if (h2 && fs.headline) h2.textContent = fs.headline;
          const p = host.querySelector('p.muted'); if (p && fs.body) p.textContent = fs.body;
          const ul = host.querySelector('.cap-list'); if (ul && Array.isArray(fs.checklist)) { ul.innerHTML=''; fs.checklist.forEach(it=>{ const li=document.createElement('li'); li.textContent=it.item||''; ul.appendChild(li); }); }
          const img = host.querySelector('.cap-media img'); if (img && (fs.image?.url || fs.image?.file?.url)) { img.src = cacheBust(fs.image.url || fs.image.file.url); img.style.display = 'block'; img.alt = fs.headline || 'Feature image'; }
          const a = host.querySelector('.cap-copy a'); if (a && fs.cta) { if (fs.cta.label) a.textContent = fs.cta.label; if (fs.cta.href) a.href = fs.cta.href; }
        }
      });
      const roles = getBlockByKey(entry, 'roles');
      if (roles && Array.isArray(roles.cards)) {
        const cards = document.querySelectorAll('.feature-grid .feature-card');
        cards.forEach((card, i) => {
          const r = roles.cards[i]; if (!r) return;
          const h3 = card.querySelector('h3'); const p = card.querySelector('p');
          if (h3 && r.title) h3.textContent = r.title;
          if (p && r.description) p.textContent = r.description;
        });
      }
    } catch (_) {}
  }

  function getBlockByKey(entry, key){
    const arr = Array.isArray(entry.page_sections) ? entry.page_sections : [];
    return arr.map(b => b[key]).find(Boolean);
  }

  function normalizeAssetUrl(url){
    if (!url) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (!url.startsWith('http')) return 'https://' + url.replace(/^\/+/, '');
    return url;
  }

  function cacheBust(url){
    if (!url) return url;
    try {
      const u = new URL(normalizeAssetUrl(url));
      u.searchParams.set('v', String(Date.now()));
      return u.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return normalizeAssetUrl(url) + sep + 'v=' + Date.now();
    }
  }

  function applyCompany(entry){
    try {
      // Overview
      const ov = getBlockByKey(entry, 'overview');
      if (ov) {
        const h2 = document.querySelector('#panel-overview h2');
        const p = document.querySelector('#panel-overview .about-copy');
        const list = document.querySelector('#panel-overview .about-points');
        if (h2 && ov.headline) h2.textContent = ov.headline;
        if (p && ov.copy) p.textContent = ov.copy;
        if (list && Array.isArray(ov.points)) {
          list.innerHTML = '';
          ov.points.forEach(it => { const li = document.createElement('li'); li.textContent = it.point || ''; list.appendChild(li); });
        }
        const img = document.querySelector('#panel-overview .about-gallery img');
        const src = ov.image && (ov.image.url || ov.image.file?.url) ? (ov.image.url || ov.image.file.url) : null;
        if (img && src) { img.src = cacheBust(src); img.style.display = 'block'; img.alt = ov.headline || 'Company image'; }
      }
      // Mission
      const ms = getBlockByKey(entry, 'mission');
      if (ms) {
        const beliefs = document.querySelector('#panel-mission .mission-points');
        const milestones = document.querySelector('#panel-mission .timeline');
        if (beliefs && Array.isArray(ms.beliefs)) {
          beliefs.innerHTML = '';
          ms.beliefs.forEach(it => { const li = document.createElement('li'); li.textContent = it.item || ''; beliefs.appendChild(li); });
        }
        if (milestones && Array.isArray(ms.milestones)) {
          milestones.innerHTML = '';
          ms.milestones.forEach(it => { const li = document.createElement('li'); li.textContent = it.item || ''; milestones.appendChild(li); });
        }
      }
      // Leadership
      const ld = getBlockByKey(entry, 'leadership');
      if (ld && Array.isArray(ld.leaders)) {
        const grid = document.querySelector('#panel-leadership .leaders');
        if (grid) {
          grid.innerHTML = '';
          ld.leaders.forEach(l => {
            const art = document.createElement('article'); art.className = 'leader';
            const img = document.createElement('img');
            img.alt = l.name || 'Leader';
            const src = (l.photo && (l.photo.url || l.photo.file?.url)) ? (l.photo.url || l.photo.file.url) : null;
            if (src) img.src = cacheBust(src);
            const h3 = document.createElement('h3'); h3.textContent = l.name || '';
            const role = document.createElement('p'); role.textContent = l.role || '';
            art.appendChild(img); art.appendChild(h3); art.appendChild(role); grid.appendChild(art);
          });
        }
      }
      // Awards
      const aw = getBlockByKey(entry, 'awards');
      if (aw && Array.isArray(aw.items)) {
        const wrap = document.querySelector('#panel-awards .awards');
        if (wrap) {
          wrap.innerHTML = '';
          aw.items.forEach((a, idx) => { const div = document.createElement('div'); div.className = `award a${(idx%3)+1}`; div.textContent = a.label || ''; wrap.appendChild(div); });
        }
      }
      // Offices band (Where we work)
      const offices = getBlockByKey(entry, 'offices');
      if (offices) {
        const bands = document.querySelectorAll('section.band');
        const band = bands && bands[0];
        if (band) {
          const h2 = band.querySelector('h2'); if (h2 && offices.title) h2.textContent = offices.title;
          const p = band.querySelector('p.muted'); if (p && offices.subtitle) p.textContent = offices.subtitle;
          const grid = band.querySelector('.offices-grid');
          if (grid && Array.isArray(offices.images)) {
            grid.innerHTML = '';
            offices.images.forEach((img) => {
              const url = img?.url || img?.file?.url;
              const el = document.createElement('img');
              el.alt = 'Office';
              if (url) el.src = cacheBust(url);
              grid.appendChild(el);
            });
          }
        }
      }
      // Values
      const vals = getBlockByKey(entry, 'values');
      if (vals && Array.isArray(vals.items)) {
        const grid = document.querySelector('#panel-values .feature-grid');
        if (grid) {
          grid.innerHTML = '';
          vals.items.forEach(v => { const art = document.createElement('article'); art.className='feature-card'; const h3=document.createElement('h3'); h3.textContent=v.title||''; const p=document.createElement('p'); p.textContent=v.description||''; art.appendChild(h3); art.appendChild(p); grid.appendChild(art); });
        }
      }
      // Careers teaser
      const teaser = getBlockByKey(entry, 'careers_teaser');
      if (teaser && Array.isArray(teaser.jobs)) {
        const grid = document.querySelector('#panel-careers .jobs-grid');
        if (grid) {
          grid.innerHTML = '';
          teaser.jobs.forEach(j => {
            const art = document.createElement('article'); art.className='job-card';
            const h3=document.createElement('h3'); h3.innerHTML = `${j.title||''}${j.badge?` <span class="badge">${j.badge}</span>`:''}`;
            const meta=document.createElement('p'); meta.className='meta'; meta.textContent=j.summary||'';
            const a=document.createElement('a'); a.className='link'; a.href=j.apply_url||'#'; a.textContent='Apply now';
            art.appendChild(h3); art.appendChild(meta); art.appendChild(a); grid.appendChild(art);
          });
        }
      }
      // Contact cards
      const cardsBlock = getBlockByKey(entry, 'contact_cards');
      if (cardsBlock && Array.isArray(cardsBlock.cards)) {
        const grid = document.querySelector('#panel-contact .feature-grid');
        if (grid) {
          grid.innerHTML = '';
          cardsBlock.cards.forEach(c => {
            const art=document.createElement('article'); art.className='feature-card';
            const h3=document.createElement('h3'); h3.textContent=c.title||'';
            const p=document.createElement('p'); p.className='muted'; p.textContent=c.description||'';
            const a=document.createElement('a'); a.className='btn ghost'; a.href=c.href||'#'; a.textContent='Open';
            art.appendChild(h3); art.appendChild(p); art.appendChild(a); grid.appendChild(art);
          });
        }
      }
      // Bottom CTA (last band)
      const b = getBlockByKey(entry, 'bottom_cta');
      if (b) {
        const band = Array.from(document.querySelectorAll('section.band')).pop();
        if (band) {
          const h2 = band.querySelector('h2'); if (h2 && b.title) h2.textContent = b.title;
          const row = band.querySelector('.cta-row'); if (row && Array.isArray(b.ctas)) {
            row.innerHTML = '';
            b.ctas.forEach(c => { const a=document.createElement('a'); a.className = 'btn ' + (row.childElementCount? 'ghost':'solid'); a.href=c.href||'#'; a.textContent=c.label||'Learn more'; row.appendChild(a); });
          }
        }
      }
    } catch (_) {}
  }

  function applyCareers(entry){
    try {
      const hero = getBlockByKey(entry, 'hero');
      if (hero) {
        const h1 = document.querySelector('.careers-hero h1'); if (h1 && hero.headline) h1.textContent = hero.headline;
        const p = document.querySelector('.careers-hero .tagline'); if (p && hero.tagline) p.textContent = hero.tagline;
        const buttons = document.querySelectorAll('.careers-hero .cta-row a');
        hero.ctas?.forEach((c, i) => { const a = buttons[i]; if (a) { a.textContent = c.label || a.textContent; a.href = c.href || a.href; } });
        // Gallery images
        const gal = document.querySelector('.careers-hero .gallery');
        if (gal && Array.isArray(hero.gallery) && hero.gallery.length) {
          gal.innerHTML = '';
          hero.gallery.forEach(img => {
            const url = img?.url || img?.file?.url;
            const el = document.createElement('img');
            el.alt = 'Team';
            if (url) el.src = cacheBust(url);
            gal.appendChild(el);
          });
        }
      }
      const benefits = getBlockByKey(entry, 'benefits');
      if (benefits && Array.isArray(benefits.items)) {
        const grid = document.querySelector('.benefits-grid'); if (grid) { grid.innerHTML=''; benefits.items.forEach(it=>{ const d=document.createElement('div'); d.className='benefit'; const h3=document.createElement('h3'); h3.textContent=it.title||''; const p=document.createElement('p'); p.className='muted'; p.textContent=it.description||''; d.appendChild(h3); d.appendChild(p); grid.appendChild(d); }); }
      }
      const locations = getBlockByKey(entry, 'locations');
      if (locations && Array.isArray(locations.items)) {
        const grid = document.querySelector('.locations'); if (grid) { grid.innerHTML=''; locations.items.forEach(it=>{ const card=document.createElement('div'); card.className='role-card'; const h3=document.createElement('h3'); h3.textContent=it.title||''; const p=document.createElement('p'); p.className='muted'; p.textContent=it.description||''; card.appendChild(h3); card.appendChild(p); grid.appendChild(card); }); }
      }
      const values = getBlockByKey(entry, 'values');
      if (values && Array.isArray(values.items)) {
        const grid = document.querySelector('.values-grid'); if (grid) { grid.innerHTML=''; values.items.forEach(it=>{ const card=document.createElement('div'); card.className='role-card'; const h3=document.createElement('h3'); h3.textContent=it.title||''; const p=document.createElement('p'); p.className='muted'; p.textContent=it.description||''; card.appendChild(h3); card.appendChild(p); grid.appendChild(card); }); }
      }
      const open = getBlockByKey(entry, 'open_roles');
      if (open && Array.isArray(open.roles)) {
        const grid = document.getElementById('rolesGrid');
        if (grid) {
          grid.innerHTML = '';
          open.roles.forEach(r => {
            const art=document.createElement('article'); art.className='role'; art.setAttribute('data-team', (r.team||'').toLowerCase()); art.setAttribute('data-text', `${(r.title||'').toLowerCase()} ${(r.location||'').toLowerCase()}`);
            const h4=document.createElement('h4'); h4.textContent=r.title||'';
            const meta=document.createElement('div'); meta.className='meta-row';
            ;['location','job_type','team'].forEach(k=>{ if(r[k]){ const s=document.createElement('span'); s.textContent=r[k]; meta.appendChild(s); }});
            const p=document.createElement('p'); p.className='muted'; p.textContent=r.summary||'';
            const row=document.createElement('div'); row.className='apply-row'; const a1=document.createElement('a'); a1.className='link'; a1.href='#'; a1.textContent='View details'; const a2=document.createElement('a'); a2.className='btn solid'; a2.href=r.apply_url||'#'; a2.textContent='Apply'; row.appendChild(a1); row.appendChild(a2);
            art.appendChild(h4); art.appendChild(meta); art.appendChild(p); art.appendChild(row); grid.appendChild(art);
          });
        }
      }
    } catch (_) {}
  }

  async function init(){
    const path = location.pathname.replace(/\\/g, '/');
    // Lightweight debug breadcrumbs
    console.log('[CS Sync] path=', path);
    try {
      if (path.endsWith('/index.html') || path === '/' || path === '') {
        const data = await fetchJSON(`/content_types/home_page/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&include[]=assets&include[]=references`);
        const entry = (data.entries && data.entries[0]) || null;
        console.log('[CS Sync] home_page count=', data.count || (data.entries||[]).length);
        if (entry && data.includes) {
          const assets = (data.includes.Asset || data.includes.assets || []).reduce((m,a)=>{ if(a.uid){ m[a.uid] = a.url || a.file?.url; } return m; }, {});
          const rolesBlk = getBlock(entry, 'roles');
          if (rolesBlk && Array.isArray(rolesBlk.cards)) {
            rolesBlk.cards.forEach(c => { const uid = c.image?.uid || c.image; if (uid && assets[uid]) c.image = { uid, url: assets[uid] }; });
          }
        }
        if (entry) applyHome(entry);
      } else if (path.endsWith('/platform.html') || path.endsWith('/platform') || path.endsWith('/platform/')) {
        const data = await fetchJSON(`/content_types/platform_page/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&include[]=assets`);
        const entry = (data.entries && data.entries[0]) || null;
        console.log('[CS Sync] platform_page count=', data.count || (data.entries||[]).length);
        if (entry) applyPlatform(entry);
      } else if (path.endsWith('/plans.html') || path.endsWith('/plans')) {
        const res = await fetchJSON(`/content_types/plan/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true`);
        const plans = (res.entries || []).sort((a,b)=> (a.most_popular===b.most_popular)?0:(a.most_popular? -1:1));
        console.log('[CS Sync] plan count=', res.count || plans.length);
        if (plans.length) {
          const cards = document.querySelectorAll('#tab-cms .plan-grid .plan');
          cards.forEach((card, i) => {
            const p = plans[i]; if (!p) return;
            const h3 = card.querySelector('h3');
            const price = card.querySelector('[data-price]');
            const ul = card.querySelector('.feat');
            const ctas = card.querySelectorAll('.cta-row a');
            if (h3) h3.textContent = p.title;
            if (price) {
              price.setAttribute('data-month', p.price_monthly||'');
              price.setAttribute('data-year', p.price_yearly||'');
              price.textContent = p.price_monthly || '';
            }
            if (ul && Array.isArray(p.features)) {
              ul.innerHTML = '';
              p.features.forEach(f => {
                const li = document.createElement('li');
                li.textContent = f.name;
                ul.appendChild(li);
              });
            }
            const primary = ctas[0]; const secondary = ctas[1];
            if (secondary && p.cta_label) secondary.textContent = p.cta_label;
            if (secondary && p.cta_url) secondary.setAttribute('href', p.cta_url);
          });
        }
      } else if (path.endsWith('/partners.html') || path.endsWith('/partners')) {
        const res = await fetchJSON(`/content_types/partner/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&limit=100&include[]=assets`);
        const partners = res.entries || [];
        const assetMap = (res.includes?.Asset || res.includes?.assets || []).reduce((m,a)=>{ if(a.uid){ m[a.uid]= a.url || a.file?.url; } return m; }, {});
        console.log('[CS Sync] partner count=', res.count || partners.length);
        if (partners.length) {
          const gridSol = document.getElementById('partnersGrid');
          const gridTech = document.getElementById('partnersTech');
          if (gridSol) gridSol.innerHTML = '';
          if (gridTech) gridTech.innerHTML = '';
          partners.forEach(p => {
            const card = document.createElement('article');
            card.className = 'p-card';
            const type = (p.partner_type||'').toLowerCase().includes('tech') ? 'technology' : 'solutions';
            card.setAttribute('data-cat', type);
            card.setAttribute('data-text', `${p.title||''} ${(p.summary||'').toLowerCase()}`);
            const img = document.createElement('img'); img.alt = p.title||'';
            const f = p.logo;
            const url = f?.url || (f?.uid ? assetMap[f.uid] : null);
            if (url) img.src = cacheBust(url);
            const h3 = document.createElement('h3'); h3.textContent = p.title||'';
            const desc = document.createElement('p'); desc.textContent = p.summary||''; desc.className = '';
            const a = document.createElement('a'); a.className='link'; a.href = p.website || '#'; a.textContent = 'Learn more';
            card.appendChild(img); card.appendChild(h3); card.appendChild(desc); card.appendChild(a);
            if (type==='technology' && gridTech) gridTech.appendChild(card); else if (gridSol) gridSol.appendChild(card);
          });
        }
      } else if (path.endsWith('/blog.html') || path.endsWith('/blog') || path.endsWith('/blog/')) {
        const params = new URLSearchParams(location.search);
        const slug = (params.get('slug')||'').replace(/^\/+|\/+$/g,'');
        if (slug) {
          const q = encodeURIComponent(JSON.stringify({ url: slug }));
          const res = await fetchJSON(`/content_types/blog_post/entries?environment=${encodeURIComponent(ENVIRONMENT)}&limit=1&query=${q}&include[]=assets`);
          const item = (res.entries||[])[0];
          const h1 = document.querySelector('section.hero h1'); if (h1 && item?.title) h1.textContent = item.title;
          const main = document.querySelector('main.container');
          if (main && item) {
            const f = item.featured_image;
            const inc = (res.includes?.Asset || res.includes?.assets || []);
            const found = inc.find ? inc.find(a=>a.uid===f?.uid) : null;
            const imgUrl = f?.url || found?.url || '';
            const bodyHtml = (item.body||'').split('\n').map(s=>`<p>${s.trim()}</p>`).join('');
            main.innerHTML = `
              <article class="doc" style="max-width:800px;margin:0 auto;">
                ${imgUrl?`<img alt="${item.title||'Cover'}" src="${cacheBust(imgUrl)}" style="width:100%;height:auto;border-radius:10px;border:1px solid var(--border);margin-bottom:14px"/>`:''}
                <h2>${item.title||''}</h2>
                <div class="muted" style="margin:6px 0 16px">${item.date? new Date(item.date).toLocaleDateString():''}</div>
                <div class="article-body">${bodyHtml||''}</div>
                <div style="margin-top:18px"><a class="btn ghost" href="/blog">← Back to blog</a></div>
              </article>`;
          }
        } else {
          const res = await fetchJSON(`/content_types/blog_post/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&limit=50&include[]=assets`);
          const items = res.entries || [];
          const assetMap = (res.includes?.Asset || res.includes?.assets || []).reduce((m,a)=>{ if(a.uid){ m[a.uid]= a.url || a.file?.url; } return m; }, {});
          console.log('[CS Sync] blog_post count=', res.count || items.length);
          if (items.length) {
            const grid = document.querySelector('.card-grid');
            if (grid) {
              grid.innerHTML = '';
              items.forEach(b => {
                const art = document.createElement('article'); art.className='role-card';
                const img = document.createElement('img'); img.className='thumb'; img.alt = b.title||'';
                const f = b.featured_image;
                const url = f?.url || (f?.uid ? assetMap[f.uid] : null);
                if (url) img.src = cacheBust(url);
                const h3 = document.createElement('h3'); h3.textContent = b.title||'';
                const p = document.createElement('p'); p.textContent = '';
                const a = document.createElement('a'); a.className='link'; const slug2 = (b.url||'').replace(/^\/+|\/+$/g,''); a.href = slug2? `/blog.html?slug=${encodeURIComponent(slug2)}`:'#'; a.textContent='Read article';
                art.appendChild(img); art.appendChild(h3); art.appendChild(p); art.appendChild(a);
                grid.appendChild(art);
              });
            }
          }
        }
      } else if (path.endsWith('/docs.html') || path.endsWith('/docs') || path.endsWith('/docs/')) {
        const res = await fetchJSON(`/content_types/doc_page/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&limit=100`);
        const items = res.entries || [];
        console.log('[CS Sync] doc_page count=', res.count || items.length);
        if (items.length) {
          const grid = document.querySelector('.feature-grid');
          if (grid) {
            grid.innerHTML = '';
            items.forEach(d => {
              const art = document.createElement('article'); art.className='feature-card';
              const h3 = document.createElement('h3'); h3.textContent = d.sidebar_title || d.title || '';
              const p = document.createElement('p'); p.textContent = d.product ? `${d.product} ${d.version||''}`.trim() : '';
              const a = document.createElement('a'); a.className='link'; a.href = d.external_url || '#'; a.target = d.external_url ? '_blank' : '_self'; a.rel='noopener'; a.textContent='Read docs';
              art.appendChild(h3); art.appendChild(p); art.appendChild(a); grid.appendChild(art);
            });
          }
        }
      } else if (path.endsWith('/marketplace.html') || path.endsWith('/marketplace')) {
        const res = await fetchJSON(`/content_types/marketplace_app/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&limit=100&include[]=assets`);
        const items = res.entries || [];
        const assetMap = (res.includes?.Asset || res.includes?.assets || []).reduce((m,a)=>{ if(a.uid){ m[a.uid]= a.url || a.file?.url; } return m; }, {});
        console.log('[CS Sync] marketplace_app count=', res.count || items.length);
        if (items.length) {
          const grid = document.querySelector('.apps');
          if (grid) {
            grid.innerHTML = '';
            items.forEach(app => {
              const art = document.createElement('article'); art.className='app';
              const img = document.createElement('img'); img.alt = app.title||'';
              const f = app.logo;
              const url = f?.url || (f?.uid ? assetMap[f.uid] : null);
              if (url) img.src = cacheBust(url);
              const h3 = document.createElement('h3'); h3.textContent = app.title||'';
              const p = document.createElement('p'); p.className='muted'; p.textContent = app.summary||'';
              const a = document.createElement('a'); a.className='link'; a.href=app.install_url||'#'; a.textContent='Install'; if (a.href && a.href.startsWith('http')) { a.target='_blank'; a.rel='noopener'; }
              art.appendChild(img); art.appendChild(h3); art.appendChild(p); art.appendChild(a);
              grid.appendChild(art);
            });
          }
        }
      } else if (path.endsWith('/events.html') || path.endsWith('/events')) {
        const res = await fetchJSON(`/content_types/event/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&limit=100`);
        const items = res.entries || [];
        console.log('[CS Sync] event count=', res.count || items.length);
        if (items.length) {
          const grid = document.querySelector('.events');
          if (grid) {
            grid.innerHTML = '';
            items.forEach(ev => {
              const art = document.createElement('article'); art.className='event';
              const time = document.createElement('time'); time.setAttribute('datetime', ev.start_date||'');
              const dt = ev.start_date ? new Date(ev.start_date) : null; time.textContent = dt ? dt.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : '';
              const h3 = document.createElement('h3'); h3.textContent = ev.title||'';
              const p = document.createElement('p'); p.textContent = ev.location ? `${ev.location}` : '';
              const a = document.createElement('a'); a.className='link'; a.href = ev.registration_url || '#'; a.textContent = 'Register';
              art.appendChild(time); art.appendChild(h3); art.appendChild(p); art.appendChild(a);
              grid.appendChild(art);
            });
          }
        }
      } else if (path.endsWith('/academy.html') || path.endsWith('/academy')) {
        const res = await fetchJSON(`/content_types/academy_article/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&limit=100&include[]=assets`);
        const items = res.entries || [];
        const assetMap = (res.includes?.Asset || res.includes?.assets || []).reduce((m,a)=>{ if(a.uid){ m[a.uid]= a.url || a.file?.url; } return m; }, {});
        console.log('[CS Sync] academy_article count=', res.count || items.length);
        if (items.length) {
          const grid = document.querySelector('.card-grid');
          if (grid) {
            grid.innerHTML = '';
            items.forEach(ac => {
              const art = document.createElement('article'); art.className='role-card';
              const img = document.createElement('img'); img.className='thumb'; img.alt = ac.title||'';
              const f = ac.featured_image;
              const url = f?.url || (f?.uid ? assetMap[f.uid] : null);
              if (url) img.src = cacheBust(url);
              const h3 = document.createElement('h3'); h3.textContent = ac.title||'';
              const p = document.createElement('p'); p.textContent = `${ac.level||''} • ${ac.duration||''}`.trim();
              const a = document.createElement('a'); a.className='link';
              const external = (ac.external_url || ac.url || '').trim();
              if (/^https?:\/\//i.test(external)) { a.href = external; a.target = '_blank'; a.rel = 'noopener'; }
              else { a.href = '#'; }
              a.textContent='Start course';
              art.appendChild(img); art.appendChild(h3); art.appendChild(p); art.appendChild(a);
              grid.appendChild(art);
            });
          }
        }
      } else if (path.endsWith('/updates.html') || path.endsWith('/updates')) {
        const res = await fetchJSON(`/content_types/product_update/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&limit=100`);
        const items = res.entries || [];
        console.log('[CS Sync] product_update count=', res.count || items.length);
        if (items.length) {
          const grid = document.querySelector('.card-grid');
          if (grid) {
            grid.innerHTML = '';
            items.forEach(up => {
              const art = document.createElement('article'); art.className='role-card';
              const h3 = document.createElement('h3'); h3.textContent = up.title || '';
              const p = document.createElement('p'); p.textContent = up.body || '';
              const a = document.createElement('a'); a.className='link'; a.href='#'; a.textContent='Read notes';
              art.appendChild(h3); art.appendChild(p); art.appendChild(a);
              grid.appendChild(art);
            });
          }
        }
      } else if (path.endsWith('/company.html') || path.endsWith('/company') || path.endsWith('/company/')) {
        const data = await fetchJSON(`/content_types/company_page/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&include[]=assets`);
        const entry = (data.entries && data.entries[0]) || null;
        console.log('[CS Sync] company_page count=', data.count || (data.entries||[]).length);
        // Enrich asset refs with URLs from includes
        if (entry && data.includes) {
          const assets = (data.includes.Asset || data.includes.assets || []).reduce((m, a) => { if (a.uid) m[a.uid] = a.url || a.file?.url || a.download_id; return m; }, {});
          if (Array.isArray(entry.page_sections)) {
            entry.page_sections.forEach(b => {
              if (b.leadership?.leaders) {
                b.leadership.leaders.forEach(l => {
                  const uid = l.photo?.uid || l.photo; if (uid && assets[uid]) l.photo = { uid, url: normalizeAssetUrl(assets[uid]) };
                });
              }
              if (b.overview?.image) {
                const uid = b.overview.image?.uid || b.overview.image; if (uid && assets[uid]) b.overview.image = { uid, url: normalizeAssetUrl(assets[uid]) };
              }
              if (Array.isArray(b.offices?.images)) {
                b.offices.images = b.offices.images.map(img => { const uid = img?.uid || img; return uid && assets[uid] ? { uid, url: normalizeAssetUrl(assets[uid]) } : img; });
              }
            });
          }
        }
        // Fallback: fetch asset URLs for any remaining UIDs without url
        if (entry && Array.isArray(entry.page_sections)) {
          for (const b of entry.page_sections) {
            if (b.leadership?.leaders) {
              for (const l of b.leadership.leaders) {
                if (l.photo && !l.photo.url && l.photo.uid) {
                  const u = await fetchAssetUrl(l.photo.uid); if (u) l.photo.url = u;
                }
              }
            }
          }
        }
        if (entry) applyCompany(entry);
      } else if (path.endsWith('/careers.html') || path.endsWith('/careers')) {
        const data = await fetchJSON(`/content_types/careers_page/entries?environment=${encodeURIComponent(ENVIRONMENT)}&include_count=true&include[]=assets`);
        const entry = (data.entries && data.entries[0]) || null;
        console.log('[CS Sync] careers_page count=', data.count || (data.entries||[]).length);
        if (entry && data.includes) {
          const assets = (data.includes.Asset || data.includes.assets || []).reduce((m, a) => { if (a.uid) m[a.uid] = a.url || a.file?.url; return m; }, {});
          if (Array.isArray(entry.page_sections)) {
            entry.page_sections.forEach(b => {
              if (b.hero?.gallery && Array.isArray(b.hero.gallery)) {
                b.hero.gallery = b.hero.gallery.map(img => {
                  const uid = img?.uid || img; return uid && assets[uid] ? { uid, url: assets[uid] } : img;
                });
              }
            });
          }
        }
        if (entry) applyCareers(entry);
      }
    } catch (e) {
      // swallow to avoid breaking page
      console.warn('Contentstack sync failed:', e.message);
    }
    
    // Show content after loading is complete
    document.body.classList.add('cs-loaded');
    
    // Re-initialize counters after content is updated
    document.querySelectorAll('[data-count-to]').forEach(element => {
      if (!element.dataset.initialized) {
        element.dataset.initialized = 'true';
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
        
        requestAnimationFrame(animateCount);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


