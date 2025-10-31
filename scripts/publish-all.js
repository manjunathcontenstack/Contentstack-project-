function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

const API_HOST = process.env.CS_MANAGEMENT_HOST || 'https://api.contentstack.io';

async function request(method, url, body) {
  const headers = {
    'Content-Type': 'application/json',
    'authorization': getEnv('CS_MANAGEMENT_TOKEN'),
    'api_key': getEnv('CS_STACK_API_KEY')
  };
  const res = await fetch(`${API_HOST}/v3${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let t; try { t = await res.text(); } catch { t = res.statusText; }
    throw new Error(`${method} ${url} failed ${res.status}: ${t}`);
  }
  try { return await res.json(); } catch { return {}; }
}

async function publishType(typeUid, environment, locale = 'en-us') {
  let skip = 0; const limit = 100; let total = 0; let published = 0; let failed = 0;
  for (;;) {
    const q = await request('GET', `/content_types/${typeUid}/entries?include_count=true&limit=${limit}&skip=${skip}`);
    const items = q?.entries || q?.items || [];
    if (!items.length) break;
    total += items.length;
    for (const it of items) {
      try {
        try {
          await request('POST', `/content_types/${typeUid}/entries/${it.uid}/publish`, {
            entry: { environments: [environment], locales: [locale] }
          });
        } catch (_) {
          await request('POST', `/content_types/${typeUid}/entries/${it.uid}/publish`, {
            locales: [locale],
            environments: [environment]
          });
        }
        published++;
      } catch (_) { failed++; }
    }
    if (items.length < limit) break;
    skip += limit;
  }
  return { typeUid, total, published, failed };
}

async function main() {
  getEnv('CS_STACK_API_KEY');
  getEnv('CS_MANAGEMENT_TOKEN');
  const environment = (process.env.CS_ENVIRONMENT || 'development').trim();
  const types = (
    process.env.CS_TYPES ? process.env.CS_TYPES.split(',') : [
      'author','person','blog_post','partner','plan','academy_article','doc_page','marketplace_app','event','product_update','home_page','platform_page','company_page','careers_page'
    ]
  );

  const results = [];
  for (const t of types) {
    const r = await publishType(t, environment);
    results.push(r);
  }
  console.log(JSON.stringify({ environment, results }, null, 2));
}

main().catch(err => { console.error('Publish-all failed:', err.message || err); process.exit(1); });


