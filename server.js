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

// Static cache
const staticOptions = {
  etag: true,
  lastModified: true,
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    if (filePath.endsWith('contentstack-sync.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
};

// Prefer React SPA build if present (apps/react/dist)
const spaDir = path.join(__dirname, 'apps', 'react', 'dist');
const hasSPA = fs.existsSync(spaDir);

// Define route helpers
const publicDir = path.join(__dirname, 'public');
const pickFile = (file) => {
  const inPublic = path.join(publicDir, file);
  if (fs.existsSync(inPublic)) return inPublic;
  return path.join(__dirname, file);
};
const mapRoute = (urlPath, file) => app.get(urlPath, (req, res) => {
  if (hasSPA) return res.sendFile(path.join(spaDir, 'index.html'));
  return res.sendFile(pickFile(file));
});

// Clean URLs (without .html) - DEFINED FIRST to take precedence
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

// .html URLs redirect to clean URLs for better UX
app.get('/index.html', (req, res) => res.redirect(301, '/'));
app.get('/platform.html', (req, res) => res.redirect(301, '/platform'));
app.get('/plans.html', (req, res) => res.redirect(301, '/plans'));
app.get('/partners.html', (req, res) => res.redirect(301, '/partners'));
app.get('/company.html', (req, res) => res.redirect(301, '/company'));
app.get('/blog.html', (req, res) => res.redirect(301, '/blog'));
app.get('/careers.html', (req, res) => res.redirect(301, '/careers'));
app.get('/contact.html', (req, res) => res.redirect(301, '/contact'));
app.get('/academy.html', (req, res) => res.redirect(301, '/academy'));
app.get('/docs.html', (req, res) => res.redirect(301, '/docs'));
app.get('/marketplace.html', (req, res) => res.redirect(301, '/marketplace'));
app.get('/updates.html', (req, res) => res.redirect(301, '/updates'));
app.get('/events.html', (req, res) => res.redirect(301, '/events'));
app.get('/start.html', (req, res) => res.redirect(301, '/start'));

// Serve SPA assets first if built
if (hasSPA) {
  app.use(express.static(spaDir, staticOptions));
}

// Serve ./public as static directory (AFTER routes)
app.use(express.static(publicDir, staticOptions));

// Fallback: React SPA index if present, else public index.html
app.use((req, res) => {
  if (hasSPA) return res.status(200).sendFile(path.join(spaDir, 'index.html'));
  return res.status(404).sendFile(pickFile('index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));


