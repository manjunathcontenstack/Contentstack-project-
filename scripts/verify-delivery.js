function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

const API_HOST = process.env.CS_DELIVERY_HOST || 'https://cdn.contentstack.io';

async function request(url) {
  const res = await fetch(`${API_HOST}/v3${url}`, {
    headers: {
      'api_key': getEnv('CS_STACK_API_KEY'),
      'access_token': getEnv('CS_DELIVERY_TOKEN')
    }
  });
  if (!res.ok) {
    let t; try { t = await res.text(); } catch { t = res.statusText; }
    throw new Error(`${url} failed ${res.status}: ${t}`);
  }
  return await res.json();
}

async function main() {
  const environment = (process.env.CS_ENVIRONMENT || 'development').trim();
  const types = [
    'author','person','blog_post','partner','plan','academy_article','doc_page','marketplace_app','event','product_update','home_page','platform_page'
  ];
  const results = [];
  for (const t of types) {
    try {
      const q = await request(`/content_types/${t}/entries?environment=${encodeURIComponent(environment)}&include_count=true&limit=1`);
      results.push({ type: t, count: q.count ?? (q.entries ? q.entries.length : 0) });
    } catch (e) {
      results.push({ type: t, error: e.message });
    }
  }
  console.log(JSON.stringify({ environment, results }, null, 2));
}

main().catch(err => { console.error('Verify-delivery failed:', err.message || err); process.exit(1); });


