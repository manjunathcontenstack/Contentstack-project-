/* global React, ReactDOM */
(function(){
  const { useEffect, useRef } = React;

  function Counter({ to = 100, duration = 1200 }){
    const ref = useRef(null);
    useEffect(() => {
      let start = null;
      const animate = (ts) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const val = Math.floor(to * p);
        if (ref.current) ref.current.textContent = String(val);
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, [to, duration]);
    return React.createElement('span', { ref });
  }

  // Mount counters if placeholders exist
  document.querySelectorAll('[data-count-to]').forEach(node => {
    const to = parseInt(node.getAttribute('data-count-to'), 10) || 0;
    ReactDOM.render(React.createElement(Counter, { to }), node);
  });
})();


