import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan('tiny'));

// Redirect .html URLs to pretty paths
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const pathOnly = req.url.split('?')[0];
    if (pathOnly === '/index.html') {
      return res.redirect(301, '/');
    }
    if (pathOnly.endsWith('.html')) {
      return res.redirect(301, pathOnly.slice(0, -5));
    }
  }
  next();
});

// Static cache
const staticOptions = {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
};

// Prefer React SPA build if present (apps/react/dist)
const spaDir = path.join(__dirname, 'apps', 'react', 'dist');
const hasSPA = fs.existsSync(spaDir);

// Serve SPA assets first if built
if (hasSPA) {
  app.use(express.static(spaDir, staticOptions));
}

// Serve ./public as static fallback (legacy static HTML)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, staticOptions));
app.use(express.static(__dirname, staticOptions));

// Pretty URLs → files (legacy only)
const pickFile = (file) => {
  const inPublic = path.join(publicDir, file);
  if (fs.existsSync(inPublic)) return inPublic;
  return path.join(__dirname, file);
};
const mapRoute = (urlPath, file) => app.get(urlPath, (req, res) => {
  if (hasSPA) return res.sendFile(path.join(spaDir, 'index.html'));
  return res.sendFile(pickFile(file));
});

mapRoute('/', 'index.html');
mapRoute('/platform', 'platform.html');
mapRoute('/plans', 'plans.html');
mapRoute('/partners', 'partners.html');
mapRoute('/company', 'company.html');
mapRoute('/blog', 'blog.html');
mapRoute('/careers', 'careers.html');
mapRoute('/contact', 'contact.html');
mapRoute('/academy', 'academy.html');
mapRoute('/docs', 'docs.html');
mapRoute('/marketplace', 'marketplace.html');
mapRoute('/updates', 'updates.html');
mapRoute('/events', 'events.html');
mapRoute('/start', 'start.html');

// Fallback: React SPA index if present, else public index.html
app.use((req, res) => {
  if (hasSPA) return res.status(200).sendFile(path.join(spaDir, 'index.html'));
  return res.status(404).sendFile(pickFile('index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));


