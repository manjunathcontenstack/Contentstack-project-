function getEnv(name){ const v = process.env[name]; if(!v) throw new Error(`Missing required env: ${name}`); return v; }
const API_HOST = process.env.CS_MANAGEMENT_HOST || 'https://api.contentstack.io';
async function main(){
  const res = await fetch(`${API_HOST}/v3/environments`, {
    headers: { 'authorization': getEnv('CS_MANAGEMENT_TOKEN'), 'api_key': getEnv('CS_STACK_API_KEY') }
  });
  if(!res.ok){ const t = await res.text(); throw new Error(`GET /environments ${res.status}: ${t}`); }
  const data = await res.json();
  console.log(JSON.stringify({ environments: data?.environments?.map(e=>({ name: e.name, uid: e.uid })) || [] }, null, 2));
}
main().catch(e=>{ console.error('List envs failed:', e.message||e); process.exit(1); });


