/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/platform.html', destination: '/platform', permanent: true },
      { source: '/plans.html', destination: '/plans', permanent: true },
      { source: '/partners.html', destination: '/partners', permanent: true },
      { source: '/company.html', destination: '/company', permanent: true },
      { source: '/blog.html', destination: '/blog', permanent: true },
      { source: '/careers.html', destination: '/careers', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/academy.html', destination: '/academy', permanent: true },
      { source: '/docs.html', destination: '/docs', permanent: true },
      { source: '/marketplace.html', destination: '/marketplace', permanent: true },
      { source: '/updates.html', destination: '/updates', permanent: true },
      { source: '/events.html', destination: '/events', permanent: true },
      { source: '/start.html', destination: '/start', permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/platform', destination: '/platform.html' },
      { source: '/plans', destination: '/plans.html' },
      { source: '/partners', destination: '/partners.html' },
      { source: '/company', destination: '/company.html' },
      { source: '/blog', destination: '/blog.html' },
      { source: '/careers', destination: '/careers.html' },
      { source: '/contact', destination: '/contact.html' },
      { source: '/academy', destination: '/academy.html' },
      { source: '/docs', destination: '/docs.html' },
      { source: '/marketplace', destination: '/marketplace.html' },
      { source: '/updates', destination: '/updates.html' },
      { source: '/events', destination: '/events.html' },
      { source: '/start', destination: '/start.html' },
    ];
  },
};

module.exports = nextConfig;


