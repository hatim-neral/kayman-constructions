(() => {
  const SCRIPT_BASE = document.currentScript ? document.currentScript.src : location.href;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Hidden start states in the CSS only apply under .motion, so the page reads fine without JS
  if (!reduced) document.documentElement.classList.add('motion');

  // Mobile menu
  const menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    const setOpen = open => {
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
    document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  // Staggered children (map dots, process steps) get their position as --i
  document.querySelectorAll('.map .places, .steps').forEach(group => {
    [...group.children].forEach((el, i) => el.style.setProperty('--i', i));
  });

  // [data-motion] blocks animate once they scroll into view. Looping animations
  // (the Houston icons) only run while they're on screen.
  const blocks = document.querySelectorAll('[data-motion]');
  if (reduced || !('IntersectionObserver' in window)) {
    blocks.forEach(el => el.classList.add('in-view'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.classList.add('in-view');
        target.classList.toggle('is-playing', isIntersecting);
      });
    }, { threshold: 0.25 });
    blocks.forEach(el => io.observe(el));
  }

  // Before/after sliders
  document.querySelectorAll('.ba-frame').forEach(frame => {
    const range = frame.querySelector('.ba-range');
    const set = v => frame.style.setProperty('--pos', v + '%');
    let touched = false;
    range.addEventListener('input', () => { touched = true; set(range.value); });
    set(range.value);

    // On first view, sweep the handle once so people see it can be dragged
    if (reduced || !('IntersectionObserver' in window)) return;
    const keys = [[0, 50], [0.35, 24], [0.75, 76], [1, 50]];
    const hint = () => {
      const start = performance.now(), dur = 1900;
      const step = now => {
        if (touched) return;
        const t = Math.min((now - start) / dur, 1);
        let k = 1;
        while (k < keys.length - 1 && t > keys[k][0]) k++;
        const [t0, v0] = keys[k - 1], [t1, v1] = keys[k];
        const f = (t - t0) / (t1 - t0);
        const eased = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        set(v0 + (v1 - v0) * eased);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { io.disconnect(); setTimeout(hint, 400); }
    }, { threshold: 0.6 });
    io.observe(frame);
  });

  /* ---------- Build story: a 3D crane builds the house as you scroll ---------- */
  const story = document.querySelector('.build-story');
  if (story) {
    const track = story.querySelector('.bs-track');
    const canvas = story.querySelector('.bs-canvas');
    const steps = [...story.querySelectorAll('.bs-steps li')];
    const label = story.querySelector('.bs-label-text');
    const bar = story.querySelector('.bs-progress span');
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const STEP_AT = [0, 0.07, 0.17, 0.26, 0.86];
    const LABELS = [[0, 'Surveying the lot'], [0.07, 'Drawing the plan'], [0.17, 'Breaking ground'], [0.26, 'Pouring the slab'],
      [0.36, 'Raising the walls'], [0.5, 'Setting the roof'], [0.745, 'Closing it in'], [0.875, 'Lights on']];
    const count = story.querySelector('.bs-count b');
    const at = (list, t) => { let i = 0; while (i < list.length - 1 && t >= list[i + 1]) i++; return i; };
    const showStep = p => {
      const active = at(STEP_AT, p);
      steps.forEach((li, i) => { li.classList.toggle('is-active', i === active); li.classList.toggle('is-done', i < active); });
      const text = LABELS[at(LABELS.map(x => x[0]), p)][1];
      if (label.textContent !== text) {
        label.textContent = text;
        label.classList.remove('is-new'); void label.offsetWidth; label.classList.add('is-new');
      }
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
      count.textContent = '0' + (active + 1);
      story.classList.toggle('bs-done', p > 0.93);
    };

    let scene = null;
    let target = reduced ? 1 : 0, current = target, running = false, last = 0;
    if (reduced) story.classList.add('bs-static');
    const read = () => {
      if (reduced) return;
      const r = track.getBoundingClientRect();
      target = clamp(-r.top / (r.height - window.innerHeight));
    };
    const tick = now => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      current += (target - current) * (1 - Math.exp(-dt / 0.14));
      if (Math.abs(target - current) < 0.0004) current = target;
      showStep(current);
      if (scene) scene.update(current);
      if (current !== target) requestAnimationFrame(tick); else { running = false; last = 0; }
    };
    const kick = () => { read(); if (!running) { running = true; requestAnimationFrame(tick); } };

    // load three.js and the scene only when the section is close
    let loading = false;
    const maybeLoad = () => {
      if (loading) return;
      const r = story.getBoundingClientRect(), vh = window.innerHeight;
      if (r.top > vh * 2.2 || r.bottom < -vh) return;
      loading = true;
      import(new URL('build-scene.js?v=20261025000446', SCRIPT_BASE).href)
        .then(m => m.createScene(canvas))
        .then(sc => {
          scene = sc;
          new ResizeObserver(() => { scene.resize(); scene.update(current); }).observe(canvas);
          scene.update(current);
        })
        .catch(() => {
          // browsers block modules on file:// pages; say so instead of showing an empty box
          const note = document.createElement('p');
          note.className = 'bs-note';
          note.textContent = location.protocol === 'file:'
            ? 'The 3D build animation needs the site to be served. Run "python3 -m http.server" in the site folder and open http://localhost:8000.'
            : 'The 3D build animation couldn’t load in this browser.';
          canvas.replaceWith(note);
        });
    };

    window.addEventListener('scroll', () => { maybeLoad(); kick(); }, { passive: true });
    window.addEventListener('resize', kick);
    read(); current = target; showStep(current); maybeLoad();
  }
})();
