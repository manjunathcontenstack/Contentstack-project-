function getEnv(name){ const v = process.env[name]; if(!v) throw new Error(`Missing required env: ${name}`); return v; }
const API_HOST = process.env.CS_DELIVERY_HOST || 'https://cdn.contentstack.io';

async function request(url){
  const res = await fetch(`${API_HOST}/v3${url}`, { headers: { 'api_key': getEnv('CS_STACK_API_KEY'), 'access_token': getEnv('CS_DELIVERY_TOKEN') } });
  if(!res.ok){ const t = await res.text(); throw new Error(`${url} failed ${res.status}: ${t}`); }
  return await res.json();
}

function normalize(url){ if(!url) return url; if(url.startsWith('//')) return 'https:'+url; if(!url.startsWith('http')) return 'https://'+url.replace(/^\/+/, ''); return url.replace('http://','https://'); }

async function main(){
  const env = (process.env.CS_ENVIRONMENT || 'development').trim();
  const data = await request(`/content_types/company_page/entries?environment=${encodeURIComponent(env)}&include_count=true`);
  const entry = (data.entries||[])[0];
  const leaders = [];
  (entry?.page_sections||[]).forEach(b=>{
    if(b.leadership?.leaders){
      b.leadership.leaders.forEach(l=> leaders.push({ name: l.name, role: l.role, photo: l.photo }));
    }
  });
  console.log(JSON.stringify({ count: leaders.length, leaders }, null, 2));
}

main().catch(e=>{ console.error('Dump company failed:', e.message||e); process.exit(1); });


