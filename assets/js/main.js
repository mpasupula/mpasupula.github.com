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

  // Selected publications on the about page: copies of the entries marked data-selected.
  const selected = document.getElementById('selected-pubs');
  if (selected) {
    document.querySelectorAll('#publications .pub[data-selected]').forEach((pub) => selected.appendChild(pub.cloneNode(true)));
  }

  // BibTeX toggles and copy buttons
  document.querySelectorAll('[data-toggle="bib"]').forEach((btn) => {
    const bib = btn.closest('.pub-body').querySelector('.bibtex');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      bib.hidden = !bib.hidden;
      btn.setAttribute('aria-expanded', String(!bib.hidden));
    });
  });
  document.querySelectorAll('.bibtex .copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.parentElement.querySelector('code').textContent;
      try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
      catch (e) { btn.textContent = 'Press Ctrl+C'; }
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  });

  // Project filters
  const filterBtns = document.querySelectorAll('.filters button');
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.projects .card').forEach((c) => c.classList.toggle('hidden', f !== 'all' && c.dataset.cat !== f));
  }));

  // Scroll progress bar and back-to-top button
  const bar = document.getElementById('progress-bar');
  const toTop = document.querySelector('.to-top');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Search palette (Ctrl+K / Cmd+K or "/")
  const search = document.getElementById('search');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (search && input && results) {
    const items = [];
    document.querySelectorAll('.nav-links a').forEach((a) => items.push({ label: a.textContent, kind: 'section', href: a.getAttribute('href') }));
    document.querySelectorAll('#publications .pub').forEach((p, i) => {
      p.id = p.id || 'pub-' + (i + 1);
      items.push({ label: p.querySelector('.pub-title').textContent, kind: 'publication', href: '#' + p.id });
    });
    document.querySelectorAll('#research .card, #projects .card').forEach((c, i) => {
      c.id = c.id || 'item-' + (i + 1);
      items.push({ label: c.querySelector('h3').textContent, kind: c.closest('#research') ? 'research' : 'project', href: '#' + c.id });
    });
    document.querySelectorAll('.social a').forEach((a) => items.push({ label: a.getAttribute('aria-label'), kind: 'link', href: a.href, external: a.target === '_blank' }));

    let matches = [];
    let cursor = 0;
    const render = () => {
      const q = input.value.trim().toLowerCase();
      matches = items.filter((it) => !q || (it.label + ' ' + it.kind).toLowerCase().includes(q));
      cursor = Math.min(cursor, Math.max(0, matches.length - 1));
      results.innerHTML = '';
      if (!matches.length) {
        const li = document.createElement('li');
        li.className = 'empty'; li.textContent = 'No results';
        results.appendChild(li);
        return;
      }
      matches.forEach((it, i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(i === cursor));
        li.textContent = it.label;
        const kind = document.createElement('small');
        kind.textContent = it.kind;
        li.appendChild(kind);
        li.addEventListener('mousemove', () => { if (cursor !== i) { cursor = i; render(); } });
        li.addEventListener('click', () => go(it));
        results.appendChild(li);
      });
      results.children[cursor].scrollIntoView({ block: 'nearest' });
    };
    const open = () => { search.hidden = false; input.value = ''; cursor = 0; render(); input.focus(); };
    const close = () => { search.hidden = true; };
    const go = (it) => {
      close();
      if (it.external) window.open(it.href, '_blank', 'noopener');
      else location.href = it.href;
    };
    document.querySelector('.search-open')?.addEventListener('click', open);
    search.addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) close(); });
    input.addEventListener('input', () => { cursor = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); cursor = (cursor + 1) % Math.max(1, matches.length); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cursor = (cursor - 1 + matches.length) % Math.max(1, matches.length); render(); }
      else if (e.key === 'Enter' && matches[cursor]) { e.preventDefault(); go(matches[cursor]); }
    });
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        search.hidden ? open() : close();
      } else if (e.key === 'Escape' && !search.hidden) close();
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

    // Fade content in as it scrolls into view
    if (!reduceMotion) {
      const reveal = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.card, .pub, .cv-list li, .news tr').forEach((el) => {
        el.classList.add('reveal');
        reveal.observe(el);
      });
    }
  }

  // About header background: faint streaks drifting like wind past a row of turbines.
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
