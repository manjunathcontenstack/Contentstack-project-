import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'react');
const destDir = path.join(root, 'apps', 'react');

async function ensureDir(p){ await fs.mkdir(p, { recursive: true }); }

async function copyDir(src, dest){
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries){
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function rmDirSafe(p){
  if (!fssync.existsSync(p)) return;
  await fs.rm(p, { recursive: true, force: true });
}

async function moveReact(){
  if (!fssync.existsSync(srcDir)){
    console.log(JSON.stringify({ moved: false, reason: 'react/ not found' }));
    return;
  }
  await ensureDir(path.join(root, 'apps'));
  try {
    await fs.rename(srcDir, destDir);
  } catch (e) {
    // Cross-device or exists: copy then remove
    if (!fssync.existsSync(destDir)) await copyDir(srcDir, destDir);
    await rmDirSafe(srcDir);
  }
  console.log(JSON.stringify({ moved: true, src: srcDir, dest: destDir }));
}

moveReact().catch(err => { console.error('move-react failed:', err); process.exit(1); });


