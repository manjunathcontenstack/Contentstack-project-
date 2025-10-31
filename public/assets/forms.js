(function(){
  // Utility
  function setText(el, txt){ if (el) el.textContent = txt; }

  // Generic form validation for data-validate forms
  document.querySelectorAll('form[data-validate]')
    .forEach(form => {
      form.addEventListener('submit', (e) => {
        const required = form.querySelectorAll('[required]');
        let firstInvalid = null;
        required.forEach(inp => {
          const wrap = inp.closest('.field');
          const hint = wrap?.querySelector('.hint');
          let valid = true;
          if (inp.type === 'checkbox') valid = inp.checked;
          else if (inp.type === 'email') valid = /\S+@\S+\.\S+/.test(inp.value);
          else valid = String(inp.value).trim().length > 0;
          wrap?.classList.toggle('error', !valid);
          if (hint) setText(hint, valid ? '' : 'This field is required');
          if (!valid && !firstInvalid) firstInvalid = inp;
        });
        if (firstInvalid) {
          e.preventDefault();
          firstInvalid.focus({ preventScroll: false });
        } else if (form.dataset.success) {
          e.preventDefault();
          const target = document.querySelector(form.dataset.success);
          if (target) {
            target.hidden = false;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            alert('Submitted!');
          }
        }
      });
    });

  // Start free: simple stepper and password strength
  const wizard = document.querySelector('[data-wizard]');
  if (wizard) {
    const steps = Array.from(wizard.querySelectorAll('[data-step]'));
    let index = 0;
    const go = (i) => {
      index = Math.max(0, Math.min(i, steps.length - 1));
      steps.forEach((s, idx) => s.hidden = idx !== index);
      const bullets = wizard.querySelectorAll('[data-bullet]');
      bullets.forEach((b, idx) => b.classList.toggle('active', idx <= index));
    };
    wizard.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => go(index + 1)));
    wizard.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', () => go(index - 1)));
    go(0);

    // Password strength
    const pwd = wizard.querySelector('#password');
    const meter = wizard.querySelector('[data-meter]');
    const label = wizard.querySelector('[data-meter-label]');
    function score(v){
      let s = 0; if (!v) return 0;
      if (v.length >= 8) s += 1;
      if (/[A-Z]/.test(v)) s += 1;
      if (/[a-z]/.test(v)) s += 1;
      if (/[0-9]/.test(v)) s += 1;
      if (/[^A-Za-z0-9]/.test(v)) s += 1; // special chars
      return s; // 0..5
    }
    function update(){
      const s = score(pwd.value);
      const pct = (s/5)*100;
      if (meter) meter.style.setProperty('--w', pct + '%');
      if (label) setText(label, ['Very weak','Weak','Fair','Good','Strong','Excellent'][s]);
    }
    if (pwd) pwd.addEventListener('input', update), update();

    // Plan card selection visual state
    const cards = wizard.querySelectorAll('#planCards .plan-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const input = card.querySelector('input'); if(input) input.checked = true;
      });
    });

    // Toggle password
    const toggle = wizard.querySelector('[data-toggle-password]');
    if (toggle && pwd) toggle.addEventListener('click', () => {
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
      toggle.textContent = pwd.type === 'password' ? 'Show' : 'Hide';
    });
  }
})();


