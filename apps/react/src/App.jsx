import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import StaticHtmlPage from './components/StaticHtmlPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<StaticHtmlPage sourcePath="/index.html" />} />
        <Route path="/platform" element={<StaticHtmlPage sourcePath="/platform.html" />} />
        <Route path="/plans" element={<StaticHtmlPage sourcePath="/plans.html" />} />
        <Route path="/partners" element={<StaticHtmlPage sourcePath="/partners.html" />} />
        <Route path="/company" element={<StaticHtmlPage sourcePath="/company.html" />} />
        <Route path="/blog" element={<StaticHtmlPage sourcePath="/blog.html" />} />
        <Route path="/careers" element={<StaticHtmlPage sourcePath="/careers.html" />} />
        <Route path="/contact" element={<StaticHtmlPage sourcePath="/contact.html" />} />
        <Route path="/academy" element={<StaticHtmlPage sourcePath="/academy.html" />} />
        <Route path="/docs" element={<StaticHtmlPage sourcePath="/docs.html" />} />
        <Route path="/marketplace" element={<StaticHtmlPage sourcePath="/marketplace.html" />} />
        <Route path="/updates" element={<StaticHtmlPage sourcePath="/updates.html" />} />
        <Route path="/events" element={<StaticHtmlPage sourcePath="/events.html" />} />
        <Route path="/start" element={<StaticHtmlPage sourcePath="/start.html" />} />

        {/* Redirect .html routes to clean paths for SPA parity */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/platform.html" element={<Navigate to="/platform" replace />} />
        <Route path="/plans.html" element={<Navigate to="/plans" replace />} />
        <Route path="/partners.html" element={<Navigate to="/partners" replace />} />
        <Route path="/company.html" element={<Navigate to="/company" replace />} />
        <Route path="/blog.html" element={<Navigate to="/blog" replace />} />
        <Route path="/careers.html" element={<Navigate to="/careers" replace />} />
        <Route path="/contact.html" element={<Navigate to="/contact" replace />} />
        <Route path="/academy.html" element={<Navigate to="/academy" replace />} />
        <Route path="/docs.html" element={<Navigate to="/docs" replace />} />
        <Route path="/marketplace.html" element={<Navigate to="/marketplace" replace />} />
        <Route path="/updates.html" element={<Navigate to="/updates" replace />} />
        <Route path="/events.html" element={<Navigate to="/events" replace />} />
        <Route path="/start.html" element={<Navigate to="/start" replace />} />

        {/* Fallback */}
        <Route path="*" element={<StaticHtmlPage sourcePath="/index.html" />} />
      </Routes>
    </>
  );
}


