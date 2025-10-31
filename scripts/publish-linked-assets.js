function getEnv(name){ const v = process.env[name]; if(!v) throw new Error(`Missing required env: ${name}`); return v; }
const API_HOST = process.env.CS_MANAGEMENT_HOST || 'https://api.contentstack.io';

async function request(method, url, body){
  const headers = { 'Content-Type': 'application/json', 'authorization': getEnv('CS_MANAGEMENT_TOKEN'), 'api_key': getEnv('CS_STACK_API_KEY') };
  const res = await fetch(`${API_HOST}/v3${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok){ let t; try { t = await res.text(); } catch { t = res.statusText; } throw new Error(`${method} ${url} failed ${res.status}: ${t}`); }
  try { return await res.json(); } catch { return {}; }
}

async function publishAsset(uid, env){
  try {
    try { await request('POST', `/assets/${uid}/publish`, { asset: { environments: [env], locales: ['en-us'] } }); }
    catch (_) { await request('POST', `/assets/${uid}/publish`, { publish_details: { environments: [env], locales: ['en-us'] } }); }
    return { uid, published: true };
  } catch (e) {
    return { uid, error: e.message };
  }
}

async function main(){
  const env = (process.env.CS_ENVIRONMENT || 'development').trim();
  // Fetch singletons
  const company = await request('GET', `/content_types/company_page/entries`);
  const compEntry = (company.entries || company.items || [])[0];
  const uids = new Set();
  if (compEntry && Array.isArray(compEntry.page_sections)){
    for (const blk of compEntry.page_sections){
      if (blk.leadership?.leaders){
        blk.leadership.leaders.forEach(l => { if (l.photo?.uid) uids.add(l.photo.uid); });
      }
      if (blk.overview?.image?.uid) uids.add(blk.overview.image.uid);
      if (blk.offices?.images){ blk.offices.images.forEach(img => { if (img?.uid) uids.add(img.uid); }); }
    }
  }
  // Blog featured images
  try {
    const blog = await request('GET', `/content_types/blog_post/entries?include_count=true&limit=100`);
    (blog.entries || []).forEach(b => { const f = b.featured_image; if (f?.uid) uids.add(f.uid); });
  } catch (_) {}
  // Home hero background image
  try {
    const home = await request('GET', `/content_types/home_page/entries`);
    const homeEntry = (home.entries || home.items || [])[0];
    if (homeEntry && Array.isArray(homeEntry.page_sections)){
      homeEntry.page_sections.forEach(blk => { if (blk.hero?.background_image?.uid) uids.add(blk.hero.background_image.uid); });
    }
  } catch (_) {}
  // Partners logos
  try {
    const partners = await request('GET', `/content_types/partner/entries?include_count=true&limit=100`);
    (partners.entries || []).forEach(p => { if (p.logo?.uid) uids.add(p.logo.uid); });
  } catch (_) {}
  const results = [];
  for (const uid of uids){ results.push(await publishAsset(uid, env)); }
  console.log(JSON.stringify({ total: uids.size, results }, null, 2));
}

main().catch(e=>{ console.error('Publish-linked-assets failed:', e.message||e); process.exit(1); });


