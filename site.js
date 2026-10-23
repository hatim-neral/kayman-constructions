(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Hidden start states in the CSS only apply under .motion, so the page reads fine without JS
  if (!reduced) document.documentElement.classList.add('motion');

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
})();
