(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Footer year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Mobile menu
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  }

  // Theme toggle: remembers the choice, otherwise follows the system setting.
  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Highlight the nav link for the section in view
  const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));

    // Fade sections in as they scroll into view
    if (!reduceMotion) {
      const reveal = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.card, .pub, .timeline li, .facts div').forEach((el) => {
        el.classList.add('reveal');
        reveal.observe(el);
      });
    }
  }

  // Hero background: faint streaks drifting like wind past a row of turbines.
  const canvas = document.getElementById('flow');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles, dpr;

  const flowColor = () => getComputedStyle(root).getPropertyValue('--flow').trim() || '15, 110, 120';

  // Velocity field: uniform stream with slowed "wake" bands behind a few virtual turbines.
  const turbines = [0.18, 0.42, 0.66].map((x, i) => ({ x, y: 0.3 + 0.2 * i }));
  const velocity = (x, y, t) => {
    let u = 1;
    let v = 0.08 * Math.sin(x * 0.004 + t * 0.0004) * Math.cos(y * 0.006);
    for (const tb of turbines) {
      const dx = x / w - tb.x;
      const dy = (y / h - tb.y) * 4;
      if (dx > 0) u -= 0.55 * Math.exp(-dy * dy * (1 + 8 * dx) * 6) / (1 + 6 * dx);
    }
    return [u, v];
  };

  const spawn = (p, anywhere) => {
    p.x = anywhere ? Math.random() * w : -10;
    p.y = Math.random() * h;
    p.life = 0;
    p.max = 200 + Math.random() * 300;
    p.speed = 0.6 + Math.random() * 0.8;
    return p;
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(160, (w * h) / 6000));
    particles = Array.from({ length: count }, () => spawn({}, true));
  };

  let running = true;
  const tick = (t) => {
    if (!running) return;
    const rgb = flowColor();
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (const p of particles) {
      const [u, v] = velocity(p.x, p.y, t);
      const nx = p.x + u * p.speed * 1.6;
      const ny = p.y + v * p.speed * 1.6;
      const fade = Math.sin(Math.PI * Math.min(1, p.life / p.max));
      ctx.strokeStyle = `rgba(${rgb}, ${0.18 * fade})`;
      ctx.beginPath();
      ctx.moveTo(p.x - u * 18, p.y - v * 18);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      p.x = nx; p.y = ny; p.life++;
      if (p.x > w + 20 || p.life > p.max) spawn(p, false);
    }
    requestAnimationFrame(tick);
  };

  resize();
  window.addEventListener('resize', resize);
  // Pause when the hero is off screen to save battery.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(tick);
    }).observe(canvas);
  }
  requestAnimationFrame(tick);
})();
