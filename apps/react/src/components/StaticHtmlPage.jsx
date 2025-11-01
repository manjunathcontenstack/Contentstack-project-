import React from 'react';
import { useNavigate } from 'react-router-dom';

function extractTitle(htmlText) {
  const match = htmlText.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1] : 'Contentstack';
}

function extractBody(htmlText) {
  const match = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : htmlText;
}

export default function StaticHtmlPage({ sourcePath }) {
  const [content, setContent] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(sourcePath, { credentials: 'same-origin' });
        const text = await res.text();
        if (cancelled) return;
        document.title = extractTitle(text);
        const body = extractBody(text);
        setContent(body);
        // allow next tick for DOM insert then init legacy behaviors
        requestAnimationFrame(() => {
          if (typeof window !== 'undefined' && window.initBehaviors) {
            try { window.initBehaviors(); } catch (e) {}
          }
          // intercept internal anchors for SPA navigation
          document.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href');
            if (!href) return;
            const isInternal = href.startsWith('/') && !href.startsWith('//');
            if (isInternal) {
              a.addEventListener('click', (e) => {
                if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                navigate(href);
              });
            }
          });
        });
      } catch (e) {
        setContent('<main class="container" style="padding:40px 0"><h2>Failed to load page.</h2></main>');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [sourcePath, navigate]);

  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  );
}


