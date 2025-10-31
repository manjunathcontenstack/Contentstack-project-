import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const cmsDir = path.join(root, 'cms');

async function ensureDir(p){ await fs.mkdir(p, { recursive: true }); }

async function copyFile(src, dest){
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function copyDir(src, dest){
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries){
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await copyFile(s, d);
  }
}

async function exists(p){ try { await fs.access(p); return true; } catch { return false; } }

async function main(){
  // 1) public/: html + assets
  await ensureDir(publicDir);
  const htmlFiles = ['index.html','platform.html','plans.html','partners.html','company.html','blog.html','careers.html','contact.html','academy.html','docs.html','marketplace.html','updates.html','events.html','start.html'];
  for (const f of htmlFiles){
    const src = path.join(root, f);
    if (await exists(src)) await copyFile(src, path.join(publicDir, f));
  }
  if (await exists(path.join(root, 'assets'))){
    await copyDir(path.join(root, 'assets'), path.join(publicDir, 'assets'));
  }

  // 2) cms/: content types + entries
  await ensureDir(cmsDir);
  if (await exists(path.join(root, 'content_types'))){
    await copyDir(path.join(root, 'content_types'), path.join(cmsDir, 'content_types'));
  }
  if (await exists(path.join(root, 'entries'))){
    await copyDir(path.join(root, 'entries'), path.join(cmsDir, 'entries'));
  }

  console.log(JSON.stringify({ publicDir, cmsDir, message: 'Organization copy complete. Server will prefer ./public if present.' }, null, 2));
}

main().catch(err => { console.error('organize-project failed:', err); process.exit(1); });


