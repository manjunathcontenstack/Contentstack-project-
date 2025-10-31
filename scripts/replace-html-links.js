import fs from 'fs/promises';
import path from 'path';
import cheerio from 'cheerio';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const publicDir = path.join(projectRoot, 'public');

function toPrettyHref(rawHref) {
  if (!rawHref) return rawHref;
  const href = rawHref.trim();
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#')
  ) return href;

  // Skip assets folder
  if (href.startsWith('assets/')) return href;

  // Normalize leading slash for checks
  const hasLeadingSlash = href.startsWith('/');
  const clean = hasLeadingSlash ? href : `/${href}`;

  // Only transform .html links
  const [pathname, rest] = clean.split(/([?#].*)/, 2);
  if (!pathname.toLowerCase().endsWith('.html')) return rawHref;

  if (pathname.toLowerCase() === '/index.html') {
    const pretty = '/' + (rest || '');
    return pretty;
  }

  const withoutExt = pathname.slice(0, -5); // remove .html
  const prettyPath = withoutExt;
  const pretty = prettyPath + (rest || '');
  return pretty;
}

async function processFile(filePath) {
  const html = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(html);
  let modified = false;

  $('a[href]').each((_, el) => {
    const prev = $(el).attr('href');
    const next = toPrettyHref(prev);
    if (next && next !== prev) {
      $(el).attr('href', next);
      modified = true;
    }
  });

  if (modified) {
    await fs.writeFile(filePath, $.html(), 'utf8');
    return true;
  }
  return false;
}

async function main() {
  const entries = await fs.readdir(publicDir, { withFileTypes: true });
  const targets = entries
    .filter(d => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map(d => path.join(publicDir, d.name));

  let changed = 0;
  for (const file of targets) {
    const did = await processFile(file);
    if (did) changed += 1;
  }
  console.log(`Rewrote links in ${changed} file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


