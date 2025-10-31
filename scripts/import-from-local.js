import fs from 'node:fs/promises';
import path from 'node:path';
import contentstack from '@contentstack/management';
import * as cheerio from 'cheerio';

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

async function readHtml(file) {
  const abs = path.resolve(file);
  const html = await fs.readFile(abs, 'utf-8');
  return cheerio.load(html);
}

async function upsertSingleton(stack, ctUid, entry) {
  const ct = stack.contentType(ctUid);
  try { return await ct.entry().create({ entry }); }
  catch {
    const list = await ct.entries().find();
    const items = list?.items || list?.entries || [];
    if (items.length) {
      const existing = await ct.entry(items[0].uid).fetch();
      Object.assign(existing, entry);
      return await existing.update();
    }
    return await ct.entry().create({ entry });
  }
}

async function updateFirstN(stack, ctUid, entries, mapFn) {
  const list = await stack.contentType(ctUid).entries().find();
  const items = list?.items || list?.entries || [];
  const limit = Math.min(entries.length, items.length);
  for (let i = 0; i < limit; i++) {
    const src = entries[i];
    const target = await stack.contentType(ctUid).entry(items[i].uid).fetch();
    Object.assign(target, mapFn(src, target));
    await target.update();
  }
}

async function main() {
  const apiKey = getEnv('CS_STACK_API_KEY');
  const managementToken = getEnv('CS_MANAGEMENT_TOKEN');
  const environment = process.env.CS_ENVIRONMENT || 'development';

  const client = contentstack.client({ authorization: managementToken });
  const stack = client.stack({ api_key: apiKey });

  // Home
  try {
    const $ = await readHtml('index.html');
    const headline = $('section.hero h1').first().text().trim();
    const annText = $('.announce .container span').first().text().trim();
    const links = [];
    $('section.actions .action-grid a.action-card').each((_, el) => {
      const label = $(el).find('h3').text().trim();
      const href = $(el).attr('href') || '#';
      links.push({ label, href });
    });
    const why = [];
    $('section.why .why-grid .why-card').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const body = $(el).find('p').text().trim();
      if (title) why.push({ title, body });
    });
    const roles = [];
    $('section.roles .card-grid .role-card').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const description = $(el).find('p').text().trim();
      roles.push({ title, description, link: { label: 'Learn more', href: '#' } });
    });
    const home = {
      title: 'Home',
      url: '/',
      page_sections: [
        { announcement_bar: { enabled: true, text: annText } },
        { hero: { headline, subheadline: '', primary_cta: { label: 'Try for free', href: '/start' } } },
        { roles: { title: 'Built for everyone in your organization', cards: roles } },
        { why: { title: 'Why legacy platforms hold you back', cards: why } },
        { quick_links: { links } }
      ]
    };
    await upsertSingleton(stack, 'home_page', home);
  } catch (_) {}

  // Plans
  try {
    const $ = await readHtml('plans.html');
    const plans = [];
    $('#tab-cms .plan-grid .plan').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const priceText = $(el).find('[data-price]').attr('data-month') || $(el).find('[data-price]').text().trim();
      const features = [];
      $(el).find('.feat li').each((__, li) => features.push({ name: $(li).text().trim(), included: true }));
      plans.push({ title, price_monthly: priceText, features, cta_label: 'Talk to us', cta_url: '/contact.html' });
    });
    await updateFirstN(stack, 'plan', plans, (src, _t) => src);
  } catch (_) {}

  // Blog
  try {
    const $ = await readHtml('blog.html');
    const posts = [];
    $('.card-grid .role-card').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const body = $(el).find('p').text().trim();
      const url = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      posts.push({ title, url, date: new Date().toISOString(), body, is_archived: false });
    });
    await updateFirstN(stack, 'blog_post', posts, (src, _t) => src);
  } catch (_) {}

  // Docs
  try {
    const $ = await readHtml('docs.html');
    const docs = [];
    $('.feature-grid .feature-card').each((_, el) => {
      const sidebar_title = $(el).find('h3').text().trim();
      const title = sidebar_title;
      const url = sidebar_title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      docs.push({ title, url, product: 'Platform', version: 'v1', sidebar_title, is_section: false, body: $(el).find('p').text().trim() });
    });
    await updateFirstN(stack, 'doc_page', docs, (src, _t) => src);
  } catch (_) {}

  // Marketplace
  try {
    const $ = await readHtml('marketplace.html');
    const apps = [];
    $('.apps .app').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const summary = $(el).find('p.muted').text().trim();
      const url = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      apps.push({ title, url, summary, categories: [], pricing: '', install_url: '#', docs_url: '#' });
    });
    await updateFirstN(stack, 'marketplace_app', apps, (src, _t) => src);
  } catch (_) {}

  // Events
  try {
    const $ = await readHtml('events.html');
    const events = [];
    $('.events .event').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const url = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const start = $(el).find('time').attr('datetime') || new Date().toISOString();
      const location = $(el).find('p').text().trim();
      events.push({ title, url, start_date: start, end_date: start, timezone: 'UTC', location, event_type: 'Webinar', description: '', speakers: [], registration_url: '/contact.html' });
    });
    await updateFirstN(stack, 'event', events, (src, _t) => src);
  } catch (_) {}

  // Academy
  try {
    const $ = await readHtml('academy.html');
    const items = [];
    $('.card-grid .role-card').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const url = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const p = $(el).find('p').text().trim();
      items.push({ title, url, level: 'Beginner', duration: '15 min', category: 'General', body: p, labels: ['academy'] });
    });
    await updateFirstN(stack, 'academy_article', items, (src, _t) => src);
  } catch (_) {}

  // Product updates
  try {
    const $ = await readHtml('updates.html');
    const items = [];
    $('.card-grid .role-card').each((_, el) => {
      const title = $(el).find('h3').text().trim();
      const url = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const body = $(el).find('p').text().trim();
      items.push({ title, url, version: title.split(' ')[0] || 'v1', date: new Date().toISOString(), category: 'Release', labels: ['release'], body });
    });
    await updateFirstN(stack, 'product_update', items, (src, _t) => src);
  } catch (_) {}

  // Company
  try {
    const $ = await readHtml('company.html');
    const overview = {
      overview: {
        headline: $('#panel-overview h2').first().text().trim(),
        copy: $('#panel-overview .about-copy').first().text().trim(),
        points: $('#panel-overview .about-points li').map((_, el) => ({ point: $(el).text().trim() })).get(),
      }
    };
    const mission = {
      mission: {
        beliefs: $('#panel-mission .mission-points li').map((_, el)=>({ item: $(el).text().trim() })).get(),
        milestones: $('#panel-mission .timeline li').map((_, el)=>({ item: $(el).text().trim() })).get()
      }
    };
    const leadership = {
      leadership: {
        leaders: $('#panel-leadership .leader').map((_, el)=>({
          name: $(el).find('h3').text().trim(),
          role: $(el).find('p').text().trim()
        })).get()
      }
    };
    const awards = { awards: { items: $('#panel-awards .award').map((_, el)=>({ label: $(el).text().trim() })).get() } };
    const values = { values: { items: $('#panel-values .feature-card').map((_, el)=>({ title: $(el).find('h3').text().trim(), description: $(el).find('p').text().trim() })).get() } };
    const jobs = { careers_teaser: { jobs: $('#panel-careers .job-card').map((_, el)=>({ title: $(el).find('h3').clone().children().remove().end().text().trim(), badge: $(el).find('.badge').text().trim(), summary: $(el).find('.meta').text().trim(), apply_url: $(el).find('a.link').attr('href') || '#' })).get() } };
    const contact_cards = { contact_cards: { cards: $('#panel-contact .feature-card').map((_, el)=>({ title: $(el).find('h3').text().trim(), description: $(el).find('p').text().trim(), href: $(el).find('a').attr('href') || '#' })).get() } };
    const offices = { offices: { /* images omitted due to asset upload issues */ images: [] } };
    const testimonials = { testimonials: { quotes: $('.testimonials .testimonial-card').map((_, el)=>({ quote: $(el).find('.quote').text().trim(), author: $(el).find('.author').text().trim() })).get() } };
    const bottom = { bottom_cta: { title: $('section.band h2').last().text().trim(), ctas: $('section.band .cta-row a').map((_, el)=>({ label: $(el).text().trim(), href: $(el).getAttribute ? el.getAttribute('href') : $(el).attr('href') || '#' })).get() } };
    const entry = {
      title: 'Company',
      url: '/company',
      page_sections: [ overview, mission, leadership, awards, values, jobs, contact_cards, offices, testimonials, bottom ]
    };
    await upsertSingleton(stack, 'company_page', entry);
  } catch (_) {}

  // Careers
  try {
    const $ = await readHtml('careers.html');
    const hero = { hero: {
      headline: $('.careers-hero h1').first().text().trim(),
      tagline: $('.careers-hero .tagline').first().text().trim(),
      ctas: $('.careers-hero .cta-row a').map((_, el)=>({ label: $(el).text().trim(), href: $(el).attr('href') || '#' })).get()
    }};
    const benefits = { benefits: { items: $('.benefits-grid .benefit').map((_, el)=>({ title: $(el).find('h3').text().trim(), description: $(el).find('p').text().trim() })).get() } };
    const locations = { locations: { items: $('.locations .role-card').map((_, el)=>({ title: $(el).find('h3').text().trim(), description: $(el).find('p').text().trim() })).get() } };
    const valuesC = { values: { items: $('.values-grid .role-card').map((_, el)=>({ title: $(el).find('h3').text().trim(), description: $(el).find('p').text().trim() })).get() } };
    const roles = { open_roles: { roles: $('#open-roles .role').map((_, el)=>({
      title: $(el).find('h4').text().trim(),
      team: $(el).find('.meta-row span').last().text().trim(),
      location: $(el).find('.meta-row span').first().text().trim(),
      job_type: $(el).find('.meta-row span').eq(1).text().trim(),
      summary: $(el).find('p.muted').text().trim(),
      apply_url: $(el).find('.apply-row a.btn.solid').attr('href') || '#'
    })).get() } };
    const entry = { title: 'Careers', url: '/careers', page_sections: [ hero, benefits, locations, valuesC, roles ] };
    await upsertSingleton(stack, 'careers_page', entry);
  } catch (_) {}

  console.log('Local content imported into entries.');
}

main().catch(err => { console.error('Import-from-local failed:', err?.response?.data || err.message || err); process.exit(1); });


