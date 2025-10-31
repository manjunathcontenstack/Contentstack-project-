function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

const API_HOST = process.env.CS_MANAGEMENT_HOST || 'https://api.contentstack.io';

async function request(url) {
  const res = await fetch(`${API_HOST}/v3${url}`, {
    headers: {
      'authorization': getEnv('CS_MANAGEMENT_TOKEN'),
      'api_key': getEnv('CS_STACK_API_KEY')
    }
  });
  if (!res.ok) {
    let t; try { t = await res.text(); } catch { t = res.statusText; }
    throw new Error(`${url} failed ${res.status}: ${t}`);
  }
  return await res.json();
}

async function getCount(typeUid) {
  // Try include_count
  try {
    const q = await request(`/content_types/${typeUid}/entries?include_count=true&limit=1`);
    const count = q?.count ?? q?.entries?.length ?? 0;
    return count;
  } catch {
    // Fallback paginate
    let skip = 0; let total = 0;
    for (;;) {
      const q = await request(`/content_types/${typeUid}/entries?limit=100&skip=${skip}`);
      const items = q?.entries || [];
      total += items.length;
      if (items.length < 100) break;
      skip += 100;
    }
    return total;
  }
}

async function main() {
  const expected = [
    'author', 'person', 'blog_post', 'partner', 'plan',
    'academy_article', 'doc_page', 'marketplace_app', 'event', 'product_update',
    'home_page', 'platform_page'
  ];

  const results = [];
  for (const uid of expected) {
    let exists = false; let count = 0; let error = null;
    try {
      const ct = await request(`/content_types/${uid}`);
      exists = !!ct?.content_type?.uid;
      count = await getCount(uid);
    } catch (e) {
      error = e.message;
    }
    results.push({ uid, exists, count, error });
  }

  console.log(JSON.stringify({ results }, null, 2));
}

main().catch(err => { console.error('Verify failed:', err.message || err); process.exit(1); });


