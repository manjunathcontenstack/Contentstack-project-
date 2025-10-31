import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const buildDir = path.join(root, 'build');
const distDir = path.join(root, 'dist');

async function ensureDir(p){ await fs.mkdir(p, { recursive: true }); }

async function rmrf(p){ if (fssync.existsSync(p)) await fs.rm(p, { recursive: true, force: true }); }

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

async function main(){
  if (!fssync.existsSync(publicDir)){
    console.error('Missing public/ directory. Ensure npm run organize ran.');
    process.exit(1);
  }
  // Build to build/ and dist/ so hosting can pick either
  await rmrf(buildDir); await ensureDir(buildDir); await copyDir(publicDir, buildDir);
  await rmrf(distDir); await ensureDir(distDir); await copyDir(publicDir, distDir);
  console.log(JSON.stringify({ output: ['build', 'dist'], source: 'public' }));
}

main().catch(err => { console.error('build-static failed:', err?.message || err); process.exit(1); });


