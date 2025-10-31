function getEnv(name){ const v = process.env[name]; if(!v) throw new Error(`Missing required env: ${name}`); return v; }
const API_HOST = process.env.CS_MANAGEMENT_HOST || 'https://api.contentstack.io';

async function request(method, url, body){
  const headers = { 'Content-Type': 'application/json', 'authorization': getEnv('CS_MANAGEMENT_TOKEN'), 'api_key': getEnv('CS_STACK_API_KEY') };
  const res = await fetch(`${API_HOST}/v3${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok){ let t; try { t = await res.text(); } catch { t = res.statusText; } throw new Error(`${method} ${url} failed ${res.status}: ${t}`); }
  try { return await res.json(); } catch { return {}; }
}

function buildLink(sidebarTitle){
  const title = (sidebarTitle||'').toLowerCase();
  if (title.includes('content delivery api') || title === 'cda') return 'https://www.contentstack.com/docs/developers/apis/content-delivery-api/';
  if (title.includes('content management api') || title === 'cma') return 'https://www.contentstack.com/docs/developers/apis/content-management-api/';
  if (title.includes('graphql')) return 'https://www.contentstack.com/docs/developers/apis/graphql-content-delivery-api/';
  if (title.includes('authentication')) return 'https://www.contentstack.com/docs/developers/apis/content-management-api/#authentication';
  if (title.includes('assets')) return 'https://www.contentstack.com/docs/developers/apis/content-delivery-api/#assets';
  if (title.includes('image')) return 'https://www.contentstack.com/docs/developers/apis/image-delivery-api/';
  if (title.includes('entries')) return 'https://www.contentstack.com/docs/developers/apis/content-delivery-api/#entries';
  if (title.includes('content types')) return 'https://www.contentstack.com/docs/developers/apis/content-management-api/#content-type';
  if (title.includes('webhooks')) return 'https://www.contentstack.com/docs/developers/webhooks/overview/';
  if (title.includes('extension') || title.includes('extensions')) return 'https://www.contentstack.com/docs/developers/developer-hub/extension-framework/overview/';
  if (title.includes('cli')) return 'https://www.contentstack.com/docs/developers/cli/overview/';
  if (title.includes('getting started')) return 'https://www.contentstack.com/docs/get-started/what-is-contentstack/';
  if (title.includes('introduction')) return 'https://www.contentstack.com/docs/';
  return 'https://www.contentstack.com/docs/';
}

async function main(){
  const env = (process.env.CS_ENVIRONMENT || 'development').trim();
  // fetch up to 100 docs
  const q = await request('GET', `/content_types/doc_page/entries?include_count=true&limit=100`);
  const items = q?.entries || [];
  const results = [];
  for (const it of items){
    const link = buildLink(it.sidebar_title || it.title);
    const payload = { entry: { external_url: link } };
    try {
      await request('PUT', `/content_types/doc_page/entries/${it.uid}`, payload);
      // publish
      try {
        await request('POST', `/content_types/doc_page/entries/${it.uid}/publish`, { entry: { environments: [env], locales: ['en-us'] } });
      } catch (_) {
        await request('POST', `/content_types/doc_page/entries/${it.uid}/publish`, { locales: ['en-us'], environments: [env] });
      }
      results.push({ uid: it.uid, title: it.title, external_url: link, status: 'updated' });
    } catch (e) {
      results.push({ uid: it.uid, title: it.title, error: e.message });
    }
  }
  console.log(JSON.stringify({ updated: results.length, results }, null, 2));
}

main().catch(e=>{ console.error('Link-docs failed:', e.message||e); process.exit(1); });


