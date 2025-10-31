import fs from 'node:fs/promises';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import path from 'node:path';

function getEnv(name, fallback) {
  const v = process.env[name] || fallback;
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
    let errText;
    try { errText = await res.text(); } catch { errText = res.statusText; }
    throw new Error(`${method} ${url} failed ${res.status}: ${errText}`);
  }
  try { return await res.json(); } catch { return {}; }
}

async function upsertGlobalField(payload) {
  const uid = payload.uid || payload.title?.toLowerCase().replace(/\s+/g, '_');
  if (!uid) throw new Error('Global field payload missing uid');
  try {
    await request('GET', `/global_fields/${uid}`);
    await request('PUT', `/global_fields/${uid}`, { global_field: payload });
    return { uid, action: 'updated' };
  } catch {
    await request('POST', `/global_fields`, { global_field: payload });
    return { uid, action: 'created' };
  }
}

async function upsertContentType(payload) {
  const uid = payload.uid || payload.title?.toLowerCase().replace(/\s+/g, '_');
  if (!uid) throw new Error('Content type payload missing uid');
  try {
    await request('GET', `/content_types/${uid}`);
    await request('PUT', `/content_types/${uid}`, { content_type: payload });
    return { uid, action: 'updated' };
  } catch {
    await request('POST', `/content_types`, { content_type: payload });
    return { uid, action: 'created' };
  }
}

async function createOrUpdateEntry(typeUid, entry) {
  // Try create
  try {
    const r = await request('POST', `/content_types/${typeUid}/entries`, { entry });
    return r?.entry?.uid || r?.uid;
  } catch (e) {
    // Try update by url or title if present
    const key = entry.url ? 'url' : 'title';
    if (!entry[key]) return null;
    try {
      const q = encodeURIComponent(JSON.stringify({ [key]: entry[key] }));
      const list = await request('GET', `/content_types/${typeUid}/entries?query=${q}`);
      const items = list?.entries || list?.items || [];
      if (!items.length) return null;
      const uid = items[0].uid;
      await request('PUT', `/content_types/${typeUid}/entries/${uid}`, { entry });
      return uid;
    } catch {
      return null;
    }
  }
}

async function publishEntry(typeUid, entryUid, environment, locale = 'en-us') {
  if (!environment || !entryUid) return;
  try {
    await request('POST', `/content_types/${typeUid}/entries/${entryUid}/publish`, {
      locales: [locale],
      environments: [environment]
    });
  } catch {
    // ignore publish errors
  }
}

async function uploadAsset(filePath, title, environment) {
  // First try pure HTTP multipart
  try {
    const FormDataCtor = globalThis.FormData || (await import('undici')).FormData;
    const form = new FormDataCtor();
    form.append('asset[title]', title);
    form.append('asset[upload]', createReadStream(filePath));
    const headers = {
      'authorization': getEnv('CS_MANAGEMENT_TOKEN'),
      'api_key': getEnv('CS_STACK_API_KEY')
    };
    const res = await fetch(`${API_HOST}/v3/assets`, { method: 'POST', headers, body: form });
    if (!res.ok) {
      let errText; try { errText = await res.text(); } catch { errText = res.statusText; }
      throw new Error(`POST /assets failed ${res.status}: ${errText}`);
    }
    const data = await res.json();
    const assetUid = data?.asset?.uid;
    if (assetUid && environment) {
      try { await request('POST', `/assets/${assetUid}/publish`, { asset: { environments: [environment], locales: ['en-us'] } }); }
      catch { try { await request('POST', `/assets/${assetUid}/publish`, { publish_details: { environments: [environment], locales: ['en-us'] } }); } catch {} }
    }
    return assetUid;
  } catch (primaryError) {
    // Fallback: use Management SDK if available in node_modules
    try {
      const cs = await import('@contentstack/management');
      const client = cs.default.client({ authorization: getEnv('CS_MANAGEMENT_TOKEN') });
      const stack = client.stack({ api_key: getEnv('CS_STACK_API_KEY') });
      const asset = await stack.asset().create({ asset: { title, upload: createReadStream(filePath) } });
      try { if (environment) await asset.publish({ environments: [environment], locales: ['en-us'] }); } catch {}
      return asset?.uid;
    } catch (sdkError) {
      throw primaryError;
    }
  }
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_.-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function copyWithSanitizedName(absPath) {
  const dir = path.dirname(absPath);
  const base = path.basename(absPath);
  const sanitized = sanitizeFilename(base);
  if (sanitized === base) return absPath;
  const target = path.join(dir, sanitized);
  await fs.copyFile(absPath, target);
  return target;
}

function pickAssetsDir(){
  const a = path.resolve('assets');
  if (existsSync(a)) return a;
  const p = path.resolve('public', 'assets');
  return p;
}

async function uploadLocalAssets(environment) {
  const dir = pickAssetsDir();
  const result = {};
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return result; }
  const imageExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const ext = path.extname(ent.name).toLowerCase();
    if (!imageExt.has(ext)) continue;
    let abs = path.join(dir, ent.name);
    try {
      // Try sanitized filename copy to avoid special-char issues
      abs = await copyWithSanitizedName(abs);
      const title = path.basename(abs);
      const uid = await uploadAsset(abs, title, environment);
      if (uid) result[title] = uid;
      else console.warn(`Asset upload returned no uid for ${ent.name}`);
    } catch (e) {
      console.warn(`Asset upload failed for ${ent.name}: ${e.message}`);
    }
  }
  return result;
}

async function fetchEntries(typeUid) {
  const list = await request('GET', `/content_types/${typeUid}/entries?include_count=true&limit=100`);
  return list?.entries || [];
}

async function fetchEntry(typeUid, uid) {
  const res = await request('GET', `/content_types/${typeUid}/entries/${uid}`);
  return res?.entry || res;
}

async function updateEntry(typeUid, uid, entry) {
  await request('PUT', `/content_types/${typeUid}/entries/${uid}`, { entry });
}

async function readJsonFiles(dir) {
  try {
    const abs = path.resolve(dir);
    const entries = await fs.readdir(abs, { withFileTypes: true });
    const files = entries.filter(e => e.isFile() && e.name.endsWith('.json')).map(e => path.join(abs, e.name));
    const jsons = [];
    for (const file of files) {
      const raw = await fs.readFile(file, 'utf-8');
      const data = JSON.parse(raw);
      jsons.push({ file, data });
    }
    return jsons;
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function sortTypesForCreation(types) {
  const order = [
    'author',
    'person',
    'blog_post',
    'partner',
    'plan',
    'academy_article',
    'doc_page',
    'marketplace_app',
    'product_update',
    'event',
    'home_page',
    'platform_page',
    'company_page',
    'careers_page'
  ];
  const weight = new Map(order.map((u, i) => [u, i]));
  return types.sort((a, b) => (weight.get(a.data.uid) ?? 999) - (weight.get(b.data.uid) ?? 999));
}

function sortEntriesForCreation(files) {
  const order = [
    'author', 'person', 'partner', 'plan',
    'blog_post', 'academy_article', 'doc_page', 'marketplace_app', 'event', 'product_update',
    'home_page', 'platform_page'
  ];
  const weight = new Map(order.map((u, i) => [u, i]));
  return files.sort((a, b) => (weight.get(a.data.content_type) ?? 999) - (weight.get(b.data.content_type) ?? 999));
}

function resolveDir(pref) {
  const cmsPath = path.resolve('cms', pref);
  const rootPath = path.resolve(pref);
  return existsSync(cmsPath) ? cmsPath : rootPath;
}

async function main() {
  const environment = process.env.CS_ENVIRONMENT; // optional for publish

  const results = { global_fields: [], content_types: [], entries: [] };

  // Upload local image assets and publish them
  const assets = await uploadLocalAssets(environment);

  // Global fields
  for (const { file, data } of await readJsonFiles(resolveDir('global_fields'))) {
    const r = await upsertGlobalField(data);
    results.global_fields.push({ file, ...r });
  }

  // Content types
  const typeFiles = await readJsonFiles(resolveDir('content_types'));
  for (const { file, data } of sortTypesForCreation(typeFiles)) {
    const r = await upsertContentType(data);
    results.content_types.push({ file, uid: data.uid, ...r });
  }

  // Entries
  const entryFiles = await readJsonFiles(resolveDir('entries'));
  for (const { file, data } of sortEntriesForCreation(entryFiles)) {
    const typeUid = data.content_type;
    for (const entry of data.entries || []) {
      const uid = await createOrUpdateEntry(typeUid, entry);
      if (uid && environment) await publishEntry(typeUid, uid, environment);
      results.entries.push({ file, type: typeUid, uid });
    }
  }

  // Post-process: set images where appropriate using uploaded assets
  const siteLogoUid = assets['logo-2.png'] || assets['logo.png'] || process.env.CS_FALLBACK_ASSET_UID || Object.values(assets)[0];
  const mongodbUid = assets['mango-db.png.svg'] || assets['mongodb.svg'];

  // Partners: set logo (MongoDB specific if available, others -> site logo)
  if (siteLogoUid) {
    try {
      const partners = await fetchEntries('partner');
      for (const p of partners) {
        const full = await fetchEntry('partner', p.uid);
        if (!full.logo || !full.logo.uid) {
          const desired = /mongodb/i.test(full.title) && mongodbUid ? mongodbUid : siteLogoUid;
          full.logo = { uid: desired };
          await updateEntry('partner', p.uid, full);
          if (environment) await publishEntry('partner', p.uid, environment);
        }
      }
    } catch (e) { console.warn('Partner logo set failed:', e.message); }
  }

  // Blog posts: featured_image -> site logo
  if (siteLogoUid) {
    try {
      const posts = await fetchEntries('blog_post');
      for (const b of posts) {
        const full = await fetchEntry('blog_post', b.uid);
        if (!full.featured_image || !full.featured_image.uid) {
          full.featured_image = { uid: siteLogoUid };
          await updateEntry('blog_post', b.uid, full);
          if (environment) await publishEntry('blog_post', b.uid, environment);
        }
      }
    } catch (e) { console.warn('Blog featured_image set failed:', e.message); }
  }

  // Home page hero background and roles images
  if (siteLogoUid) {
    try {
      const homes = await fetchEntries('home_page');
      if (homes.length) {
        const home = await fetchEntry('home_page', homes[0].uid);
        const sections = Array.isArray(home.page_sections) ? home.page_sections : [];
        for (const blk of sections) {
          if (blk.hero) blk.hero.background_image = { uid: siteLogoUid };
          if (blk.roles && Array.isArray(blk.roles.cards)) {
            blk.roles.cards = blk.roles.cards.map(c => ({
              ...c,
              image: c.image && c.image.uid ? c.image : { uid: siteLogoUid }
            }));
          }
        }
        home.page_sections = sections;
        await updateEntry('home_page', homes[0].uid, home);
        if (environment) await publishEntry('home_page', homes[0].uid, environment);
      }
    } catch (e) { console.warn('Home roles image set failed:', e.message); }
  }

  console.log(JSON.stringify({ ...results, assets }, null, 2));
}

main().catch(err => { console.error('Import failed:', err.message || err); process.exit(1); });


