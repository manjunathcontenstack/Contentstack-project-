/* global React, ReactDOM */
(function(){
  const { useMemo, useState } = React;

  const CAPABILITIES = [
    { id: 'cap-personalization', name: 'Omnichannel Personalization', category: 'Personalization', blurb: 'Tailor content and offers across channels in real time.' },
    { id: 'cap-journey', name: 'Journey Orchestration', category: 'Personalization', blurb: 'Coordinate end‑to‑end experiences with rules and triggers.' },
    { id: 'cap-testing', name: 'Optimization & Testing', category: 'Personalization', blurb: 'Run A/B/n tests and deploy winners quickly.' },
    { id: 'cap-analytics', name: 'Content Analytics', category: 'Data', blurb: 'Measure content performance and operations health.' },
    { id: 'cap-data', name: 'Audience Segmentation', category: 'Data', blurb: 'Segment audiences from first‑party signals.' },
    { id: 'cap-journey-analytics', name: 'Journey Analytics', category: 'Data', blurb: 'Understand customer paths and drop‑offs.' },
    { id: 'cap-headless', name: 'Content Management', category: 'Content', blurb: 'API‑first CMS with visual editing and workflows.' },
    { id: 'cap-visual', name: 'Visual Building', category: 'Content', blurb: 'Compose pages with guardrails.' },
    { id: 'cap-hosting', name: 'Front‑end Hosting', category: 'Hosting', blurb: 'Connect frameworks and run functions at the edge.' },
  ];

  function FilterableList(){
    const [filter, setFilter] = useState('All');
    const categories = useMemo(() => ['All', ...Array.from(new Set(CAPABILITIES.map(c => c.category)))], []);
    const visible = useMemo(() => CAPABILITIES.filter(c => filter === 'All' ? true : c.category === filter), [filter]);
    return (
      React.createElement('div', {},
        React.createElement('div', { className: 'tabbar', style: { marginTop: 0, marginBottom: 8 } },
          categories.map(cat => React.createElement('button', {
            key: cat,
            role: 'tab',
            className: cat === filter ? 'active' : '',
            onClick: () => setFilter(cat)
          }, cat))
        ),
        React.createElement('div', { className: 'feature-grid' },
          visible.map(cap => React.createElement('a', { key: cap.id, href: `#${cap.id}`, className: 'feature-card' },
            React.createElement('h3', null, cap.name),
            React.createElement('p', { className: 'muted' }, cap.blurb),
            React.createElement('span', { className: 'link' }, 'Jump to section')
          ))
        )
      )
    );
  }

  const root = document.getElementById('platform-root');
  if (root) ReactDOM.render(React.createElement(FilterableList), root);
})();


